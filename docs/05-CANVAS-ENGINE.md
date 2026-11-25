# 05 — Canvas Engine, Camera Math & Safari-Safe Pixel Filter Spec

> **Dokumen**: `docs/05-CANVAS-ENGINE.md`  
> **Target Direktori**: `web/src/features/booth/engine/`  
> **Lingkup**: Akuisisi stream `getUserMedia`, matematika *aspect-ratio center-crop*, algoritma manipulasi piksel `getImageData` + Look-Up Table (LUT) yang 100% aman di Safari/iOS (tanpa `ctx.filter`), serta komposisi kanvas *photo strip* 300 DPI.

---

## 1. Spesifikasi Teknis Akuisisi Kamera (`camera-controller.ts`)

### 1.1 Constraint `getUserMedia` & Fallback Bertingkat

Kamera web pada laptop maupun smartphone memiliki rasio bawaan yang beragam (`16:9`, `4:3`, atau `9:16` pada ponsel vertikal). Kita meminta resolusi ideal `1920×1080` pada `30fps` tanpa audio (`audio: false`), dengan fallback otomatis jika perangkat keras tidak mendukung constraint ideal:

```typescript
export interface CameraStreamOptions {
  deviceId?: string | null
  facingMode?: 'user' | 'environment'
}

export async function acquireCameraStream(
  options: CameraStreamOptions = {},
): Promise<MediaStream> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error('Browser Anda tidak mendukung akses kamera (WebRTC).')
  }

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: 1920, min: 640 },
    height: { ideal: 1080, min: 480 },
    frameRate: { ideal: 30, max: 60 },
    ...(options.deviceId
      ? { deviceId: { exact: options.deviceId } }
      : { facingMode: { ideal: options.facingMode ?? 'user' } }),
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoConstraints,
    })
  } catch (err) {
    // Fallback jika deviceId exact atau resolusi min gagal dipenuhi oleh webcam lama
    if (
      err instanceof DOMException &&
      (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError')
    ) {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      })
    }
    throw err
  }
}
```

### 1.2 Aturan Kompatibilitas `<video>` di iOS Safari & Mobile WebKit

Agar video stream dapat diputar dan disalin ke `<canvas>` via `ctx.drawImage(video, ...)` di iOS Safari tanpa layar hitam atau *fullscreen hijack*:
1. Elemen `<video>` **wajib** memiliki atribut `playsInline`, `muted`, dan `autoPlay`.
2. Sebelum memanggil `ctx.drawImage(video, ...)`, pastikan `video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA` (`readyState >= 2`) dan `video.videoWidth > 0`.
3. **Pelepasan Perangkat Keras (`stopCameraStream`)**:
   ```typescript
   export function stopCameraStream(
     stream: MediaStream | null | undefined,
     videoEl?: HTMLVideoElement | null,
   ): void {
     if (stream) {
       stream.getTracks().forEach((track) => {
         track.stop()
       })
     }
     if (videoEl) {
       videoEl.srcObject = null
     }
   }
   ```

---

## 2. Matematika Center-Crop & Horizontal Mirror (`center-crop.ts`)

### 2.1 Rumus Center-Crop (`object-fit: cover` pada Canvas 2D)

Setiap slot pose di dalam *photo strip* memiliki dimensi target tetap:
$$W_t = 1056\text{ px}, \quad H_t = 720\text{ px} \implies R_t = \frac{W_t}{H_t} = \frac{1056}{720} = \frac{11}{7.5} \approx 1.4667$$

Misalkan stream `<video>` memiliki dimensi piksel intrinsik $(W_s, H_s)$ dari `video.videoWidth` dan `video.videoHeight`, sehingga rasio aspek sumber adalah:
$$R_s = \frac{W_s}{H_s}$$

Untuk memotong bagian tengah video tanpa distorsi (*zero stretching/squishing*):

1. **Kasus A — Sumber Lebih Lebar dari Target ($R_s > R_t$)** *(contoh: webcam `1920×1080`, $R_s = 1.7778 > 1.4667$)*:
   - Tinggi sumber diambil penuh, lebar sumber dipotong dari kiri dan kanan:
   $$s_h = H_s, \quad s_w = \text{round}(H_s \times R_t)$$
   $$s_x = \text{round}\left(\frac{W_s - s_w}{2}\right), \quad s_y = 0$$

2. **Kasus B — Sumber Lebih Tinggi / Sempit dari Target ($R_s \le R_t$)** *(contoh: webcam `1280×960` $4:3$ atau kamera depan ponsel vertikal `1080×1920`)*:
   - Lebar sumber diambil penuh, tinggi sumber dipotong dari atas dan bawah:
   $$s_w = W_s, \quad s_h = \text{round}\left(\frac{W_s}{R_t}\right)$$
   $$s_x = 0, \quad s_y = \text{round}\left(\frac{H_s - s_h}{2}\right)$$

### 2.2 Implementasi TypeScript Center-Crop + Mirroring

```typescript
export interface CropRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

/**
 * Menghitung koordinat sub-rectangle (sx, sy, sw, sh) dari sumber (srcW, srcH)
 * agar tepat memenuhi target (targetW, targetH) tanpa distorsi (setara CSS object-fit: cover).
 */
export function computeCenterCrop(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
): CropRect {
  if (srcW <= 0 || srcH <= 0 || targetW <= 0 || targetH <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(1, srcW), sh: Math.max(1, srcH) }
  }

  const srcRatio = srcW / srcH
  const targetRatio = targetW / targetH

  if (srcRatio > targetRatio) {
    // Sumber lebih lebar: potong sisi kiri & kanan
    const sh = srcH
    const sw = Math.round(srcH * targetRatio)
    const sx = Math.round((srcW - sw) / 2)
    return { sx, sy: 0, sw, sh }
  } else {
    // Sumber lebih tinggi: potong sisi atas & bawah
    const sw = srcW
    const sh = Math.round(srcW / targetRatio)
    const sy = Math.round((srcH - sh) / 2)
    return { sx: 0, sy, sw, sh }
  }
}

/**
 * Mengambil 1 frame dari <video>, melakukan center-crop ke (targetW x targetH),
 * dan membalik secara horizontal jika isMirrored = true.
 */
export function captureCroppedFrameFromVideo(
  video: HTMLVideoElement,
  targetW: number,
  targetH: number,
  isMirrored: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas context')
  }

  const { sx, sy, sw, sh } = computeCenterCrop(
    video.videoWidth,
    video.videoHeight,
    targetW,
    targetH,
  )

  ctx.save()
  if (isMirrored) {
    ctx.translate(targetW, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH)
  ctx.restore()

  return canvas
}
```

---

## 3. Mesin Filter Piksel Safari-Safe (`pixel-filters.ts`)

### 3.1 Mengapa `ctx.filter` Dilarang Keras?

Properti `CanvasRenderingContext2D.filter` (seperti `ctx.filter = 'grayscale(100%) contrast(120%)'`) memiliki dukungan yang buruk dan tidak konsisten pada mesin WebKit / Safari iOS (sering diabaikan sama sekali, menghasilkan gambar tanpa filter saat `toBlob()` dipanggil).

Oleh karena itu, **seluruh filter warna di MyPhotoBut wajib beroperasi langsung pada buffer memori piksel (`ImageData.data` bertipe `Uint8ClampedArray`)** menggunakan kombinasi **Look-Up Table (LUT) 256-entry** dan **transformasi matriks warna RGB**.

### 3.2 Optimasi Performa dengan Precomputed Contrast LUT

Menghitung fungsi pangkat atau kurva S (`Math.pow` / `Math.tanh`) untuk setiap kanal warna pada kanvas `1056 × 720` ($760.320\text{ piksel} \times 3 = 2,28\text{ juta operasi}$) di dalam loop akan membebani CPU mobile. Dengan membangun tabel `Uint8Array(256)` sekali saja di awal, operasi kurva kontras di dalam loop berubah menjadi pembacaan indeks array $O(1)$ (`lut[r]`):

$$f_{\text{S-curve}}(x, c, b_{\text{lift}}) = \text{clamp}_{0..255}\left( \left(\left(\frac{x}{255} - 0.5\right) \times c + 0.5\right) \times (255 - b_{\text{lift}}) + b_{\text{lift}} \right)$$

### 3.3 Spesifikasi Matematis 5 Preset Filter Studio

| ID Preset | Nama Studio | Rumus Transformasi Piksel per $(R, G, B) \in [0, 255]^3$ | Karakteristik Visual |
| :--- | :--- | :--- | :--- |
| `normal` | **Studio Natural** | $R' = \text{LUT}_{1.04, 0}[R]$, $G' = \text{LUT}_{1.04, 0}[G]$, $B' = \text{LUT}_{1.04, 0}[B]$ | Warna asli yang bersih dengan sedikit penguatan mikro-kontras studio ($c = 1.04$). |
| `bw-classic` | **Ilford HP5 B&W** | 1. Luminansi panchromatic: $Y = (54 R + 183 G + 19 B) \gg 8$ *(aproksimasi integer Rec.709: $0.2126 R + 0.7152 G + 0.0722 B$)*<br>2. Kurva kontras tinggi + *shadow lift*: $V = \text{LUT}_{1.24, 10}[Y]$<br>3. $R' = V, \; G' = V, \; B' = V$ | Hitam-putih kontras tinggi dengan bayangan perak lembut (*matte shadow floor* di nilai `10`) dan *highlight* tegas. |
| `warm-vintage` | **Kodak Gold 200** | 1. Ambil kurva dasar: $r = \text{LUT}_{1.08, 6}[R], \; g = \text{LUT}_{1.05, 4}[G], \; b = \text{LUT}_{1.02, 4}[B]$<br>2. Matriks hangat: <br>$R' = 1.06 r + 0.04 g + 10$<br>$G' = 0.02 r + 1.01 g + 3$<br>$B' = 0.91 b - 6$ | Warna kulit keemasan (*golden warm highlights*), bayangan sedikit hangat, dan reduksi kanal biru pada *midtones*. |
| `cool-editorial` | **Cinestill 800T** | 1. Ambil kurva dasar: $r = \text{LUT}_{1.12, 4}[R], \; g = \text{LUT}_{1.10, 4}[G], \; b = \text{LUT}_{1.10, 8}[B]$<br>2. Split-tone tungsten:<br>$R' = 0.93 r - 4$<br>$G' = 1.02 g + 4$<br>$B' = 1.09 b + 12$ | Nuansa sinematik dingin (*tungsten-balanced*), bayangan kebiruan/teal halus, dan kontras editorial yang tajam. |
| `sepia-aged` | **Darkroom Sepia** | 1. Luminansi dasar: $Y = \text{LUT}_{1.14, 12}[(54 R + 183 G + 19 B) \gg 8]$<br>2. Toning perak-gelatin hangat:<br>$R' = 1.07 Y + 14$<br>$G' = 0.96 Y + 4$<br>$B' = 0.82 Y - 10$ | Monokrom arsip hangat (*silver-gelatin warm tone*) yang elegan—tidak kuning mencolok seperti filter sepia CSS standar. |

### 3.4 Implementasi Lengkap `pixel-filters.ts`

```typescript
import type { FilterPreset } from '../schemas/booth.schema'

function buildContrastLUT(contrast: number, shadowLift = 0): Uint8Array {
  const lut = new Uint8Array(256)
  const range = 255 - shadowLift
  for (let i = 0; i < 256; i++) {
    const normalized = i / 255
    const curved = (normalized - 0.5) * contrast + 0.5
    const clamped = Math.max(0, Math.min(1, curved))
    lut[i] = Math.round(clamped * range + shadowLift)
  }
  return lut
}

// Precomputed LUTs (dibuat satu kali saat modul dimuat)
const LUT_NORMAL = buildContrastLUT(1.04, 0)
const LUT_BW_HP5 = buildContrastLUT(1.24, 10)
const LUT_WARM_R = buildContrastLUT(1.08, 6)
const LUT_WARM_G = buildContrastLUT(1.05, 4)
const LUT_WARM_B = buildContrastLUT(1.02, 4)
const LUT_COOL_R = buildContrastLUT(1.12, 4)
const LUT_COOL_G = buildContrastLUT(1.10, 4)
const LUT_COOL_B = buildContrastLUT(1.10, 8)
const LUT_SEPIA_Y = buildContrastLUT(1.14, 12)

/**
 * Memodifikasi ImageData secara in-place menggunakan preset filter yang dipilih.
 * 100% kompatibel di Chrome, Firefox, macOS Safari, dan iOS Safari.
 */
export function applyPixelFilterToImageData(
  imageData: ImageData,
  preset: FilterPreset,
): ImageData {
  const data = imageData.data
  const len = data.length

  switch (preset) {
    case 'normal': {
      for (let i = 0; i < len; i += 4) {
        data[i] = LUT_NORMAL[data[i]]
        data[i + 1] = LUT_NORMAL[data[i + 1]]
        data[i + 2] = LUT_NORMAL[data[i + 2]]
      }
      break
    }

    case 'bw-classic': {
      for (let i = 0; i < len; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // Integer Rec.709 luminance: (54*R + 183*G + 19*B) >> 8
        const lum = (54 * r + 183 * g + 19 * b) >> 8
        const v = LUT_BW_HP5[lum]
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
      }
      break
    }

    case 'warm-vintage': {
      for (let i = 0; i < len; i += 4) {
        const r = LUT_WARM_R[data[i]]
        const g = LUT_WARM_G[data[i + 1]]
        const b = LUT_WARM_B[data[i + 2]]

        // Uint8ClampedArray otomatis melakukan clamp ke [0, 255]
        data[i] = 1.06 * r + 0.04 * g + 10
        data[i + 1] = 0.02 * r + 1.01 * g + 3
        data[i + 2] = 0.91 * b - 6
      }
      break
    }

    case 'cool-editorial': {
      for (let i = 0; i < len; i += 4) {
        const r = LUT_COOL_R[data[i]]
        const g = LUT_COOL_G[data[i + 1]]
        const b = LUT_COOL_B[data[i + 2]]

        data[i] = 0.93 * r - 4
        data[i + 1] = 1.02 * g + 4
        data[i + 2] = 1.09 * b + 12
      }
      break
    }

    case 'sepia-aged': {
      for (let i = 0; i < len; i += 4) {
        const lum = (54 * data[i] + 183 * data[i + 1] + 19 * data[i + 2]) >> 8
        const y = LUT_SEPIA_Y[lum]

        data[i] = 1.07 * y + 14
        data[i + 1] = 0.96 * y + 4
        data[i + 2] = 0.82 * y - 10
      }
      break
    }
  }

  return imageData
}
```

---

## 4. Spesifikasi Geometri & Komposisi Photo Strip (`strip-compositor.ts`)

### 4.1 Tabel Dimensi Master (300 DPI Print-Ready) vs. Preview (Interactive 60fps)

Agar interaksi memilih filter di layar *Studio Edit* berjalan pada 60fps tanpa jeda, kita menggunakan **skala proporsional** (`scale = 1/3` untuk preview, `scale = 1` untuk master export):

| Parameter Geometri | Master 4-Pose (`strip-4`) | Preview 4-Pose (`scale = 1/3`) | Master 3-Pose (`strip-3`) | Preview 3-Pose (`scale = 1/3`) |
| :--- | :--- | :--- | :--- | :--- |
| **Lebar Total Kanvas ($W$)** | `1200 px` | `400 px` | `1200 px` | `400 px` |
| **Tinggi Total Kanvas ($H$)** | `3600 px` | `1200 px` | `2800 px` | `933 px` |
| **Margin Samping & Atas ($M$)** | `72 px` | `24 px` | `72 px` | `24 px` |
| **Lebar Slot Foto ($W_{\text{slot}}$)** | `1056 px` | `352 px` | `1056 px` | `352 px` |
| **Tinggi Slot Foto ($H_{\text{slot}}$)** | `720 px` | `240 px` | `720 px` | `240 px` |
| **Jarak Antar Slot ($G$)** | `44 px` | `14.67 px` | `48 px` | `16 px` |
| **Tinggi Area Footer ($H_{\text{footer}}$)** | `440 px` | `146 px` | `400 px` | `133 px` |

Rumus posisi vertikal ($Y_k$) untuk slot foto ke-$k$ (dengan indeks $k \in \{0, 1, \dots, N-1\}$):
$$X_k = M, \quad Y_k = M + k \times (H_{\text{slot}} + G)$$

Verifikasi matematis untuk **Master 4-Pose (`1200 × 3600 px`)**:
- $Y_0 = 72\text{ px}$ (rentang `72 .. 792`)
- $Y_1 = 72 + 1 \times (720 + 44) = 836\text{ px}$ (rentang `836 .. 1556`)
- $Y_2 = 72 + 2 \times 764 = 1600\text{ px}$ (rentang `1600 .. 2320`)
- $Y_3 = 72 + 3 \times 764 = 2364\text{ px}$ (rentang `2364 .. 3084`)
- Area Footer: `3084 .. 3600` (tinggi bersih `516 px` untuk teks *caption*, *date stamp*, dan tanda studio).

### 4.2 Spesifikasi Warna & Ornamen `FrameTheme` (Berdasarkan `desain.png`)

| ID Tema (`FrameTheme`) | Warna Latar Kanvas (`bg`) | Border Luar Strip (`outerBorder`) | Border Tiap Slot Foto (`slotBorder`) | Warna Teks Caption (`textPrimary`) | Warna Date Stamp & Aksen (`textSecondary`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `obsidian-dark` | `#181818` | `#2E2E2E` (`4px`) | `#2E2E2E` (`2px`) | `#FFFFFF` | `#D8FF54` *(Acid Lime Accent)* |
| `crisp-white` | `#FFFFFF` | `#E4E4E7` (`4px`) | `#181818` (`2px`) | `#181818` | `#52525B` *(dengan aksen `#C575F8`)* |
| `acid-lime` | `#D8FF54` | `#181818` (`4px`) | `#181818` (`2.5px`) | `#181818` | `#181818` |
| `electric-lavender` | `#C575F8` | `#181818` (`4px`) | `#181818` (`2.5px`) | `#181818` | `#181818` |

### 4.3 Implementasi Compositor & Exporter (`strip-compositor.ts`)

```typescript
import { applyPixelFilterToImageData } from './pixel-filters'
import type {
  FilterPreset,
  FrameTheme,
  LayoutType,
} from '../schemas/booth.schema'

export interface StripComposeConfig {
  layoutType: LayoutType
  poses: HTMLCanvasElement[]
  filterPreset: FilterPreset
  frameTheme: FrameTheme
  captionText: string
  dateStampEnabled: boolean
  timestamp: Date
  /** Skala render: 1.0 untuk master 300 DPI (1200x3600), 1/3 untuk live preview (400x1200) */
  scale?: number
}

interface ThemePalette {
  bg: string
  outerBorder: string
  slotBorder: string
  textPrimary: string
  textSecondary: string
  accentBadgeBg: string
  accentBadgeText: string
}

const THEME_PALETTES: Record<FrameTheme, ThemePalette> = {
  'obsidian-dark': {
    bg: '#181818',
    outerBorder: '#2E2E2E',
    slotBorder: '#2E2E2E',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    accentBadgeBg: '#D8FF54',
    accentBadgeText: '#181818',
  },
  'crisp-white': {
    bg: '#FFFFFF',
    outerBorder: '#E4E4E7',
    slotBorder: '#181818',
    textPrimary: '#181818',
    textSecondary: '#52525B',
    accentBadgeBg: '#C575F8',
    accentBadgeText: '#181818',
  },
  'acid-lime': {
    bg: '#D8FF54',
    outerBorder: '#181818',
    slotBorder: '#181818',
    textPrimary: '#181818',
    textSecondary: '#181818',
    accentBadgeBg: '#181818',
    accentBadgeText: '#D8FF54',
  },
  'electric-lavender': {
    bg: '#C575F8',
    outerBorder: '#181818',
    slotBorder: '#181818',
    textPrimary: '#181818',
    textSecondary: '#181818',
    accentBadgeBg: '#181818',
    accentBadgeText: '#FFFFFF',
  },
}

export function formatStudioDateStamp(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} // ${hh}:${min}`
}

/**
 * Merender komposisi photo strip lengkap ke targetCanvas dengan font "Parkinsans".
 */
export async function renderPhotoStripToCanvas(
  targetCanvas: HTMLCanvasElement,
  config: StripComposeConfig,
): Promise<void> {
  // Pastikan webfont ("Parkinsans" & "JetBrains Mono") sudah siap sebelum menggambar teks
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready
  }

  const scale = config.scale ?? 1
  const isFourPose = config.layoutType === 'strip-4'
  const baseWidth = 1200
  const baseHeight = isFourPose ? 3600 : 2800

  const width = Math.round(baseWidth * scale)
  const height = Math.round(baseHeight * scale)

  targetCanvas.width = width
  targetCanvas.height = height

  const ctx = targetCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to obtain 2D context for strip compositor')
  }

  const palette = THEME_PALETTES[config.frameTheme]
  const margin = Math.round(72 * scale)
  const slotW = Math.round(1056 * scale)
  const slotH = Math.round(720 * scale)
  const gap = Math.round((isFourPose ? 44 : 48) * scale)

  // 1. Gambar Latar Kertas / Bingkai Utama
  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, width, height)

  // 2. Gambar Tiap Slot Pose dengan Filter Piksel Safari-Safe
  const slotCount = isFourPose ? 4 : 3
  const slotScratch = document.createElement('canvas')
  slotScratch.width = slotW
  slotScratch.height = slotH
  const scratchCtx = slotScratch.getContext('2d', { willReadFrequently: true })
  if (!scratchCtx) {
    throw new Error('Unable to create scratch canvas context')
  }

  for (let i = 0; i < slotCount; i++) {
    const poseCanvas = config.poses[i]
    const x = margin
    const y = margin + i * (slotH + gap)

    if (poseCanvas) {
      scratchCtx.clearRect(0, 0, slotW, slotH)
      scratchCtx.drawImage(poseCanvas, 0, 0, slotW, slotH)

      const imgData = scratchCtx.getImageData(0, 0, slotW, slotH)
      applyPixelFilterToImageData(imgData, config.filterPreset)
      scratchCtx.putImageData(imgData, 0, 0)

      ctx.drawImage(slotScratch, x, y, slotW, slotH)
    } else {
      ctx.fillStyle = '#222222'
      ctx.fillRect(x, y, slotW, slotH)
    }

    // Garis tepi slot foto
    ctx.strokeStyle = palette.slotBorder
    ctx.lineWidth = Math.max(1, Math.round(2 * scale))
    ctx.strokeRect(x, y, slotW, slotH)
  }

  // 3. Area Footer: Custom Caption ("Parkinsans"), Date Stamp ("JetBrains Mono"), & Tanda Studio
  const lastSlotBottom = margin + slotCount * slotH + (slotCount - 1) * gap
  const footerCenterY = lastSlotBottom + (height - lastSlotBottom) / 2

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Caption Utama menggunakan font "Parkinsans"
  const caption = config.captionText.trim() || 'MYPHOTOBUT // STUDIO'
  ctx.fillStyle = palette.textPrimary
  ctx.font = `700 ${Math.round(52 * scale)}px "Parkinsans", system-ui, sans-serif`
  ctx.fillText(caption, width / 2, footerCenterY - Math.round(36 * scale))

  // Date Stamp + Kode Preset Film
  const metaParts: string[] = []
  if (config.dateStampEnabled) {
    metaParts.push(formatStudioDateStamp(config.timestamp))
  }
  metaParts.push(config.filterPreset.toUpperCase())

  ctx.fillStyle = palette.textSecondary
  ctx.font = `600 ${Math.round(24 * scale)}px "JetBrains Mono", monospace`
  ctx.fillText(
    metaParts.join('  •  '),
    width / 2,
    footerCenterY + Math.round(38 * scale),
  )
  ctx.restore()

  // 4. Garis Bingkai Luar Strip
  ctx.strokeStyle = palette.outerBorder
  ctx.lineWidth = Math.max(1, Math.round(4 * scale))
  ctx.strokeRect(0, 0, width, height)
}

/**
 * Mengekspor photo strip resolusi penuh (scale = 1.0, 300 DPI) menjadi binary Blob.
 * - Gunakan format 'image/jpeg' (quality 0.92) untuk unggah cepat ke Cloudflare R2 (~500KB - 1.1MB).
 * - Gunakan format 'image/png' untuk unduhan arsip lokal tanpa kompresi lossy.
 */
export async function exportHighResStripBlob(
  config: Omit<StripComposeConfig, 'scale'>,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): Promise<{ blob: Blob; width: number; height: number }> {
  const masterCanvas = document.createElement('canvas')
  await renderPhotoStripToCanvas(masterCanvas, { ...config, scale: 1 })

  const blob = await new Promise<Blob>((resolve, reject) => {
    masterCanvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Canvas toBlob() returned null'))
          return
        }
        resolve(result)
      },
      mimeType,
      mimeType === 'image/jpeg' ? quality : undefined,
    )
  })

  return {
    blob,
    width: masterCanvas.width,
    height: masterCanvas.height,
  }
}
```
