# 02 — System Architecture, Data Flow & Security Boundaries

> **Dokumen**: `docs/02-ARCHITECTURE.md`  
> **Lingkup**: Topologi sistem 4-layer, pembagian *Client vs. Edge BFF vs. Go Core API*, *sequence diagram* unggah langsung **Cloudflare R2 Presigned PUT** (`booth` & `template`), alur autentikasi tanpa password (**Magic Link & Google OAuth 2.0**), batas keamanan `X-API-SECRET`, serta `R2SessionCleanupWorker`.

---

## 1. Topologi Arsitektur Sistem

Arsitektur **MyPhotoBut** menggunakan pola **Edge BFF (`createServerFn`) + Go Fiber Core Service + Direct-to-R2 Object Upload** yang melayani dua jalur pengguna secara simultan:
1. **Guest Photobooth Flow (100% Zero-Login)**: Pengambilan foto webcam, filter piksel, overlay frame PNG komunitas, upload langsung `image/webp` (+ opsional `gif`) ke Cloudflare R2, dan halaman berbagi QR Code (`/s/$shareCode`).
2. **Creator & Admin Flow (Passwordless Auth + JWT)**: Login via Email Magic Link atau Google OAuth 2.0, upload frame overlay PNG transparan ke R2, manajemen katalog template kreator, dan moderasi admin.

```mermaid
flowchart TB
  subgraph Client["1. Client Browser (Desktop & Mobile Safari / Chrome)"]
    Webcam["WebRTC getUserMedia\n(Live Video Stream)"]
    Canvas["Canvas 2D Engine\nCenter-Crop + getImageData Filters\n+ PNG Template Overlay Compositor"]
    BoothUI["/booth Route (ssr: false)\n& Creator Studio UI"]
  end

  subgraph Edge["2. Cloudflare Workers (web/ - TanStack Start)"]
    ServerFn["TanStack Server Functions (createServerFn)\nBFF Security Boundary (Injects X-API-SECRET + Bearer JWT)"]
    SSRRoute["SSR Routes: / & /s/$shareCode\nLoader + Dynamic OpenGraph <head>"]
  end

  subgraph CoreAPI["3. Go Backend Service (service/ - Fiber v2)"]
    APISecretMW["middleware.APISecret\n(Validates X-API-SECRET Header)"]
    JWTMW["middleware.JWTAuth + RequireRoles\n(Protected Creator & Admin Routes)"]
    AuthMod["Module A: auth\nMagic Link + Google OAuth + Refresh"]
    BoothMod["Module B: booth (100% Guest)\nPresign + Confirm + Share + Gallery"]
    TplMod["Module C: template\nCatalog + Creator Upload + Admin"]
    WorkerMod["Module D: worker\nR2SessionCleanupWorker (1h Ticker)"]
  end

  subgraph CloudData["4. Cloud Persistence & Object Storage"]
    Postgres[("Neon Serverless PostgreSQL\nusers, magic_link_tokens, refresh_tokens,\ntemplates, photo_sessions")]
    R2[("Cloudflare R2 Bucket\nbooth/* (.webp/.gif) & templates/* (.png)")]
    CDN["Cloudflare R2 Public Custom Domain\n(e.g. cdn.myphotobut.com)"]
  end

  Webcam --> Canvas --> BoothUI
  BoothUI -- "1. RPC: presignBoothUploadFn" --> ServerFn
  ServerFn -- "POST /api/v1/booth/presign\n(X-API-SECRET)" --> APISecretMW --> BoothMod
  BoothMod -- "Generate MORA-8X2A & Presign PUT (5m TTL)" --> R2

  BoothUI -- "2. Direct HTTP PUT (Binary WebP / GIF / PNG)\nBypasses Worker & Go Server" --> R2

  BoothUI -- "3. RPC: createBoothSessionFn" --> ServerFn
  ServerFn -- "POST /api/v1/booth/sessions\n(X-API-SECRET)" --> APISecretMW --> BoothMod
  BoothMod -- "Insert photo_sessions & Increment template.usage_count" --> Postgres

  SSRRoute -- "4. Loader: getBoothSessionFn(shareCode)" --> ServerFn
  ServerFn -- "GET /api/v1/booth/sessions/:shareCode" --> APISecretMW --> BoothMod --> Postgres

  BoothUI -- "5. Creator Auth & Template Submit" --> ServerFn
  ServerFn -- "X-API-SECRET + Authorization: Bearer <jwt>" --> APISecretMW --> JWTMW
  JWTMW --> AuthMod & TplMod --> Postgres

  R2 --> CDN -- "Serves Photo Strips, GIFs, & PNG Overlays" --> Client
  WorkerMod -- "Every 1h: Query expires_at <= NOW()" --> Postgres
  WorkerMod -- "S3 DeleteObject (image & gif)" --> R2
```

---

## 2. Pembagian Tanggung Jawab Layer Sistem

| Layer | Komponen | Tanggung Jawab Utama | Batasan Keamanan & Performa |
| :--- | :--- | :--- | :--- |
| **1. Client Browser** | `/booth` (`ssr: false`), Canvas 2D Engine | • Akuisisi webcam `getUserMedia`.<br>• *Center-crop* & *horizontal flip*.<br>• Manipulasi piksel `getImageData` (Safari-safe).<br>• Menggambar layer PNG `overlay_url` dari katalog `template`.<br>• Ekspor `Blob` (`image/webp` + opsional `image/gif`) dan HTTP `PUT` langsung ke R2. | • **Dilarang** menyimpan `X-API-SECRET`.<br>• **Dilarang** memanggil Go API secara langsung dari browser. |
| **2. Edge BFF & SSR** | Cloudflare Worker (`web/`, TanStack Start) | • Menjalankan `createServerFn` sebagai BFF yang menyisipkan `X-API-SECRET` (dari Worker Secrets) dan meneruskan `Authorization: Bearer <access_token>` untuk route kreator.<br>• Merender SSR + OpenGraph meta tags untuk `/s/$shareCode` dan galeri publik di `/`. | • **Dilarang** mem-proxy file biner gambar melewati `createServerFn`.<br>• **Wajib** membaca `process.env.API_SECRET` di dalam `.handler()` (per-request). |
| **3. Core Backend API** | Go Service (`service/`, Fiber v2 + GORM) | • Memvalidasi `X-API-SECRET` di seluruh `/api/v1/*`.<br>• **Module `auth`**: Magic Link, Google OAuth 2.0, JWT & Refresh Token rotation.<br>• **Module `booth`**: Presign R2 (`MORA-8X2A`), simpan sesi, increment `usage_count` template, galeri publik.<br>• **Module `template`**: Katalog frame publik, presign & registrasi PNG kreator, moderasi admin.<br>• **Module `worker`**: `R2SessionCleanupWorker` setiap 1 jam. | • **Dilarang** melakukan pemrosesan gambar di CPU server Go. |

---

## 3. Sequence Diagram A: Guest Photobooth & Direct-to-R2 Upload (`Module booth`)

Alur utama pengguna tamu (100% tanpa login) dari selesai mengedit strip hingga mendapatkan QR Code (`MORA-8X2A`):

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Guest User (/booth)
  participant Browser as Browser Canvas Engine
  participant Worker as CF Worker (createServerFn)
  participant GoAPI as Go Fiber (/api/v1/booth)
  participant DB as Neon PostgreSQL
  participant R2 as Cloudflare R2 Bucket

  Guest->>Browser: Klik "Generate QR & Share"
  Browser->>Browser: Render Strip + PNG Overlay -> toBlob('image/webp', 0.92) (+ optional GIF)

  rect rgb(245, 245, 247)
    Note over Browser,R2: Langkah 1 — Request Presigned PUT URL (TTL 5 Menit)
    Browser->>Worker: presignBoothUploadFn({ content_type: "image/webp", layout_type: "strip-4", include_gif: false })
    Worker->>GoAPI: POST /api/v1/booth/presign (Header: X-API-SECRET)
    GoAPI->>GoAPI: Generate share_code ("MORA-8X2A") & S3 PresignPutObject (TTL=5m)
    GoAPI-->>Worker: 200 OK { share_code, storage_key, image_upload_url, image_public_url }
    Worker-->>Browser: Return presigned data
  end

  rect rgb(235, 248, 255)
    Note over Browser,R2: Langkah 2 — Direct Binary Upload ke Cloudflare R2
    Browser->>R2: HTTP PUT <image_upload_url> (Content-Type: image/webp, Body: Blob)
    R2-->>Browser: 200 OK
  end

  rect rgb(238, 252, 235)
    Note over Browser,DB: Langkah 3 — Konfirmasi Sesi & Increment Template Usage
    Browser->>Worker: createBoothSessionFn({ share_code, storage_key, image_url, layout_type, frame_theme, template_id, is_public })
    Worker->>GoAPI: POST /api/v1/booth/sessions (Header: X-API-SECRET)
    GoAPI->>DB: BEGIN TX -> INSERT INTO photo_sessions (expires_at = NOW() + 24h)
    opt Jika memakai template_id
      GoAPI->>DB: UPDATE templates SET usage_count = usage_count + 1 WHERE id = template_id
    end
    GoAPI->>DB: COMMIT
    GoAPI-->>Worker: 201 Created { id, share_code: "MORA-8X2A", expires_at }
    Worker-->>Browser: Return confirmed session
  end

  Browser-->>Guest: Tampilkan QR Code SVG & Link /s/MORA-8X2A
```

---

## 4. Sequence Diagram B: Creator Passwordless Auth & Community Frame Submission (`Module auth` & `template`)

Alur kreator saat login tanpa password dan mengunggah bingkai PNG transparan baru:

```mermaid
sequenceDiagram
  autonumber
  actor Creator as Frame Creator
  participant Browser as Browser Studio UI
  participant Worker as CF Worker (createServerFn)
  participant GoAPI as Go Fiber (/api/v1/auth & /templates)
  participant DB as Neon PostgreSQL
  participant R2 as Cloudflare R2 Bucket

  rect rgb(248, 240, 255)
    Note over Creator,DB: Fase 1 — Passwordless Login (Magic Link atau Google OAuth)
    Creator->>Browser: Masukkan email / Klik "Continue with Google"
    Browser->>Worker: sendMagicLinkFn({ email }) / initGoogleOAuthFn()
    Worker->>GoAPI: POST /api/v1/auth/magic-link (atau GET /api/v1/auth/google)
    GoAPI->>DB: Upsert user & simpan SHA-256(token) di magic_link_tokens (TTL 15m)
    Creator->>Browser: Klik link verifikasi dari email
    Browser->>Worker: verifyMagicLinkFn({ token })
    Worker->>GoAPI: POST /api/v1/auth/magic-link/verify
    GoAPI->>DB: Tandai token used_at = NOW(), email_verified = true, simpan refresh_token
    GoAPI-->>Worker: 200 OK { access_token, refresh_token, user }
  end

  rect rgb(245, 255, 230)
    Note over Creator,R2: Fase 2 — Upload Frame Overlay PNG (Maks 5 MB)
    Creator->>Browser: Pilih file frame PNG transparan & judul "Y2K Chrome"
    Browser->>Worker: presignTemplateFn({ content_type: "image/png", layout_type: "strip-4" })
    Worker->>GoAPI: POST /api/v1/templates/presign (X-API-SECRET + Bearer <access_token>)
    GoAPI-->>Worker: 200 OK { storage_key, upload_url, public_url }
    Worker-->>Browser: Return presigned URL
    Browser->>R2: HTTP PUT <upload_url> (Content-Type: image/png, Body: PNG File)
    R2-->>Browser: 200 OK
    Browser->>Worker: createTemplateFn({ title: "Y2K Chrome", layout_type: "strip-4", storage_key, overlay_url, thumbnail_url })
    Worker->>GoAPI: POST /api/v1/templates (X-API-SECRET + Bearer <access_token>)
    GoAPI->>DB: INSERT INTO templates (creator_id, status='pending')
    GoAPI-->>Worker: 201 Created { id, title, status, created_at }
  end
```

---

## 5. Batas Keamanan (*Security Boundaries*) & Konfigurasi R2

1. **Isolasi `X-API-SECRET` di Cloudflare Worker Secrets**:
   - Disimpan di `web/.dev.vars` saat development lokal dan di Cloudflare Worker Secrets (`wrangler secret put API_SECRET`) saat staging/production.
   - Hanya dibaca di dalam `.handler()` pada `createServerFn` (`const apiSecret = process.env.API_SECRET`).
2. **Keamanan Token Autentikasi (`auth` Module)**:
   - Token Magic Link mentah (`raw_magic_token`) dan Refresh Token mentah hanya dikirim ke klien; di dalam tabel `magic_link_tokens` dan `refresh_tokens`, PostgreSQL **hanya menyimpan nilai hash SHA-256 (`token_hash`)** sehingga kebocoran baca database tidak membocorkan sesi aktif.
3. **Kebijakan CORS Cloudflare R2**:
   - Mengizinkan method `["PUT", "GET", "HEAD"]` dengan header `["Content-Type", "Content-Length"]` dari origin aplikasi web agar unggahan `image/webp`, `image/gif`, dan `image/png` langsung dari browser berjalan mulus.
4. **Pembersihan Otomatis oleh `R2SessionCleanupWorker`**:
   - Berjalan setiap **1 jam** di `service/internal/worker/cleanup.go`.
   - Menghapus objek `storage_key` (dan `gif_storage_key`) dari Cloudflare R2 serta menghapus record `photo_sessions` yang telah melewati `expires_at` (24–48 jam). Objek template di `templates/*` **tidak** dihapus oleh worker kecuali kreator sendiri yang memanggil `DELETE /api/v1/templates/:id`.
