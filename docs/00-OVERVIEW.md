# 00 — Product Overview & Scope

> **Dokumen**: `docs/00-OVERVIEW.md`  
> **Status**: Approved for Implementation  
> **Target Repository**: Monorepo (`web/` — Boilerpad TanStack Start, `service/` — Boilerpad Go Service)

---

## 1. Visi Produk

**MyPhotoBut** adalah aplikasi *web-based studio photobooth* modern dengan ekosistem **Community Creator Frames** yang menghadirkan pengalaman pemotretan studio langsung di dalam browser desktop maupun mobile.

Aplikasi ini menggabungkan dua pilar utama:
1. **100% Guest / Zero-Login Photobooth (`/booth` & `/s/$shareCode`)**:
   - Pengunjung dapat langsung memotret 3 atau 4 pose via webcam dengan *countdown* & *shutter flash*, menerapkan filter warna piksel yang 100% aman di Safari/iOS (`getImageData`), memilih tema bingkai brand ([desain.png](file:///home/muliaandiki/project/myphotobut/desain.png) — `obsidian-dark`, `crisp-white`, `acid-lime`, `electric-lavender`) atau memakai **Frame Overlay PNG Transparan** buatan kreator komunitas, lalu mengunduh hasil *photo strip* (`image/webp` / `png` + opsional `gif`) atau membagikannya secara instan lewat **QR Code** (`MORA-8X2A`).
2. **Passwordless Creator Ecosystem (`Magic Link` & `Google OAuth 2.0`)**:
   - Ilustrator, desainer, dan kreator dapat login tanpa password menggunakan **Email Magic Link** atau **Google OAuth 2.0** untuk mengunggah desain frame PNG transparan mereka ke katalog komunitas (`/api/v1/templates`), menampilkan handle kredit `@username` mereka pada setiap foto yang dicetak memakai frame tersebut, serta memantau statistik penggunaan (`usage_count`) secara *real-time*.

---

## 2. User Persona & Target Pengalaman

| Persona | Konteks Penggunaan | Kebutuhan Utama | Target Pengalaman (*Experience Goal*) |
| :--- | :--- | :--- | :--- |
| **1. The Spontaneous Guest** *(Gen-Z / Millennial Mobile & Desktop User — Zero-Login)* | Nongkrong bersama teman, acara komunitas, atau di depan laptop ingin membuat *photo strip* cepat. | Langsung memotret tanpa harus mendaftar akun, memilih filter film & bingkai keren, lalu memindai QR Code untuk menyimpan ke HP. | Dari membuka URL hingga mengunduh strip selesai dalam **< 45 detik** tanpa form login. |
| **2. The Frame Creator / Artist** *(Illustrator, Brand, Event Organizer — Passwordless Auth)* | Membuat desain frame PNG transparan bertema khusus (Y2K, grup idola, acara ulang tahun, brand kafe) untuk dipakai orang banyak. | Login cepat via Magic Link / Google, upload file PNG transparan langsung ke R2, dan melihat berapa kali frame mereka dipakai (`usage_count`). | Proses submit frame baru selesai dalam **< 2 menit**, dan kredit `@username` tampil otomatis di halaman share. |
| **3. Pop-Up Kiosk / Event Host** *(Self-Service iPad / Laptop + Monitor)* | Mengoperasikan layar browser *full-screen* di pameran atau *pop-up booth*. | Pengunjung cukup memindai QR Code (`MORA-8X2A`) di layar untuk mengunduh foto & GIF mereka, dengan opsi menampilkan foto di galeri showcase publik (`is_public`). | Alur *Direct-to-R2 Upload* selesai dalam **< 2.5 detik** dan penyimpanan cloud dibersihkan otomatis setelah 24–48 jam. |

---

## 3. Prinsip Desain & Arsitektur Teknis Utama

1. **Zero-Friction Guest Core + Optional Creator Auth**:
   - Modul **`booth`** (`/api/v1/booth/*`) berjalan **100% Guest / Zero-Login**.
   - Modul **`auth`** (`/api/v1/auth/*`) menggunakan autentikasi modern tanpa password (**Email Magic Link** 15 menit + **Google OAuth 2.0** + **Refresh Token Rotation**) khusus untuk kreator template dan moderator admin.
2. **Dual-Theme Design System (`desain.png` + `"Parkinsans"`)**:
   - Menggunakan 2 tema kontras tinggi (**Crisp White Light `#FFFFFF`** & **Obsidian Dark `#181818`**) yang dipadukan dengan aksen **Acid Lime (`#D8FF54`)** dan **Electric Lavender (`#C575F8`)** serta font utama **`"Parkinsans"`**.
3. **100% Client-Side Canvas Compositing & Safari-Safe Pixel Filtering**:
   - Pemotongan rasio gambar (*center-crop*), manipulasi warna piksel (`getImageData` + LUT tanpa `ctx.filter`), penggabungan layer frame overlay PNG transparan, dan pembuatan *photo strip* dilakukan sepenuhnya di browser pengguna.
4. **Zero-Trust Secret Boundary (BFF Pattern & Direct-to-R2 Presigned PUT)**:
   - Seluruh endpoint Go Fiber di bawah `/api/v1` wajib menyertakan header `X-API-SECRET` yang hanya diakses dari Cloudflare Worker Secrets melalui TanStack Start `createServerFn`.
   - File gambar (`image/webp`, `image/png`) dan animasi (`image/gif`) diunggah langsung dari browser ke **Cloudflare R2** via *Presigned PUT URL* (berlaku 5 menit).
5. **Ephemeral Session Storage & Automated R2 Cleanup**:
   - Sesi foto di R2 dan tabel `photo_sessions` memiliki masa aktif (`expires_at`, default 24–48 jam) dan dibersihkan secara otomatis setiap 1 jam oleh `R2SessionCleanupWorker` (`service/internal/worker/cleanup.go`).

---

## 4. Scope Fitur Berdasarkan Modul

| Modul | Cakupan Fitur Utama |
| :--- | :--- |
| **A. Photobooth Studio (`/booth` & `/api/v1/booth/*`)** | • Akuisisi webcam `getUserMedia` dengan *mirror toggle*, pilihan layout (`strip-4` / `strip-3`), *countdown* (`3s` / `5s`), *shutter flash*, dan *retake* per pose.<br>• 5 Filter piksel Safari-safe (`normal`, `bw-classic`, `warm-vintage`, `cool-editorial`, `sepia-aged`).<br>• 4 Tema warna bingkai dasar (`obsidian-dark`, `crisp-white`, `acid-lime`, `electric-lavender`) + katalog **Official & Community PNG Frame Overlays**.<br>• Ekspor `image/webp` (atau `png`/`jpeg`) + opsional animasi `gif` via `POST /api/v1/booth/presign` & `POST /api/v1/booth/sessions`.<br>• Galeri showcase publik (`GET /api/v1/booth/gallery`) untuk sesi dengan `is_public = true`. |
| **B. QR Share & SSR Preview (`/s/$shareCode`)** | • Kode berbagi pendek yang mudah dibaca (contoh: `MORA-8X2A`).<br>• Halaman SSR (`GET /api/v1/booth/sessions/:shareCode`) dengan metadata OpenGraph (`og:image`), tombol unduh foto/GIF, kredit `@creator`, dan waktu kedaluwarsa. |
| **C. Creator Auth (`/api/v1/auth/*`)** | • Login/registrasi tanpa password via **Email Magic Link** (`POST /auth/magic-link` & `/auth/magic-link/verify`) dan **Google OAuth 2.0** (`GET /auth/google` & `/auth/google/callback`).<br>• Manajemen sesi JWT (`POST /auth/refresh`, `POST /auth/logout`) serta kustomisasi handle `@username` & `avatar_url` (`GET` & `PATCH /auth/me`). |
| **D. Template Catalog & Moderation (`/api/v1/templates/*`)** | • Katalog publik dengan filter layout, kategori (`official` / `community`), dan urutan kepopuleran (`usage_count`).<br>• Upload frame PNG transparan kreator (maks 5 MB) via R2 Presigned PUT (`POST /templates/presign` & `POST /templates`).<br>• Dashboard kreator (`GET /templates/me`, `PATCH /templates/:id`, `DELETE /templates/:id`) & moderasi admin (`PATCH /admin/templates/:id/status`). |
| **E. Background Worker (`internal/worker/cleanup.go`)** | • `R2SessionCleanupWorker` via `time.Ticker` (1 jam) yang menghapus file foto/GIF kedaluwarsa di Cloudflare R2 dan record `photo_sessions` di PostgreSQL. |

---

## 5. Metrik Keberhasilan & Target Teknis (SLAs)

- **Time-to-First-Photo (TTFP)**: **< 45 detik** dari membuka halaman utama hingga seluruh pose selesai diambil.
- **Preview Filter & Frame Overlay Latency**: Pergantian filter piksel dan frame PNG transparan di Studio Editor selesai dalam **< 32ms** (60fps).
- **Direct-to-R2 Upload Latency**: Unggah `image/webp` hasil komposisi ke R2 Presigned PUT URL selesai dalam **< 2 detik** pada jaringan 4G/Wi-Fi.
- **Zero Memory / Hardware Leak**: `MediaStreamTrack.stop()` selalu dipanggil saat keluar dari tahap capture, dan seluruh objek sesi R2 yang melewati `expires_at` terhapus bersih oleh `R2SessionCleanupWorker`.

---

## 6. Peta Navigasi Dokumentasi PRD

| File Dokumen | Fokus Bahasan Utama |
| :--- | :--- |
| **[00-OVERVIEW.md](file:///home/muliaandiki/project/myphotobut/docs/00-OVERVIEW.md)** | Visi produk (Guest Photobooth + Creator Ecosystem), persona, cakupan 4 modul, dan SLA teknis. |
| **[01-USER-FLOW-UX.md](file:///home/muliaandiki/project/myphotobut/docs/01-USER-FLOW-UX.md)** | Sistem **Design Tokens 2-Tema** (`desain.png` + `"Parkinsans"`), alur layar, dan *state machine* kamera. |
| **[02-ARCHITECTURE.md](file:///home/muliaandiki/project/myphotobut/docs/02-ARCHITECTURE.md)** | Topologi sistem, *sequence diagram* R2 Presigned PUT (`booth` & `template`), alur Magic Link / Google OAuth, dan batas keamanan BFF `createServerFn`. |
| **[03-BACKEND-SPEC.md](file:///home/muliaandiki/project/myphotobut/docs/03-BACKEND-SPEC.md)** | Katalog lengkap 20 endpoint core (`auth`, `booth`, `template`, `worker`), ERD & migrasi SQL PostgreSQL, model GORM, kontrak DTO, dan `R2SessionCleanupWorker`. |
| **[04-FRONTEND-SPEC.md](file:///home/muliaandiki/project/myphotobut/docs/04-FRONTEND-SPEC.md)** | Struktur modul `web/src/features/`, route TanStack Start (`ssr: false` vs SSR OpenGraph), skema Zod, dan BFF Server Functions (`createServerFn`). |
| **[05-CANVAS-ENGINE.md](file:///home/muliaandiki/project/myphotobut/docs/05-CANVAS-ENGINE.md)** | Spesifikasi `getUserMedia`, rumus *center-crop*, filter piksel Safari-safe (`getImageData` + LUT), komposisi layer PNG template overlay, dan ekspor `image/webp`. |
