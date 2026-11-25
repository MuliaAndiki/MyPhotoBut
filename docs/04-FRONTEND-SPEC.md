# 04 — Frontend Specification (`boilerpad-tanstack-start`)

> **Dokumen**: `docs/04-FRONTEND-SPEC.md`  
> **Target Direktori**: `web/` (`boilerpad-tanstack-start`, React 19, `@tanstack/react-start` `1.168.61`, `@tanstack/react-router` `1.170.42`, `@tanstack/react-query` `^5.104.2`, Tailwind CSS v4, Zod v4, Cloudflare Workers)  
> **Lingkup**: Struktur modul `src/features/booth/`, `src/features/template/`, dan `src/features/auth/`, definisi route TanStack Start (`ssr: false` vs SSR OpenGraph), skema Zod v4, serta BFF Server Functions (`createServerFn`) untuk ke-20 endpoint backend.

---

## 1. Struktur Folder Modul Frontend (`web/src/`)

Selaras dengan 3 modul HTTP utama di backend (`auth`, `booth`, `template`), kode fitur di `web/src/features/` diorganisasikan secara modular:

```text
web/src/
├── routes/
│   ├── __root.tsx                          # Root document shell + Google Fonts "Parkinsans"
│   ├── _public.tsx                         # Public layout wrapper (Header + ThemeToggle)
│   ├── _public.index.tsx                   # Landing page + Public Showcase Gallery (/api/v1/booth/gallery)
│   ├── _public.auth.login.tsx              # Halaman Login Creator (Magic Link + Google OAuth)
│   ├── _public.auth.verify.tsx             # Halaman verifikasi Magic Link (?token=...) & Google Callback
│   ├── booth.tsx                           # Client-only Photobooth Studio (ssr: false)
│   ├── s.$shareCode.tsx                    # SSR QR Share Page + Dynamic OpenGraph <head>
│   └── creator.index.tsx                   # Creator Dashboard: Submit PNG Frame & Statistik usage_count
│
└── features/
    ├── auth/
    │   ├── schemas/auth.schema.ts          # Zod schemas: MagicLink, Verify, Google, Refresh, Profile (/me)
    │   ├── server/auth.server.ts           # createServerFn BFF untuk /api/v1/auth/*
    │   └── hooks/use-auth.ts               # Hook manajemen sesi kreator & profil @username
    ├── template/
    │   ├── schemas/template.schema.ts      # Zod schemas: Catalog, Presign PNG, Create, Update, Moderate
    │   ├── server/template.server.ts       # createServerFn BFF untuk /api/v1/templates/*
    │   ├── queries/template.queries.ts     # queryOptions katalog template & /templates/me
    │   └── components/
    │       ├── template-picker.tsx         # Pemilih frame overlay PNG di Studio Customizer
    │       └── template-upload-dialog.tsx  # Form kreator upload PNG transparan (maks 5 MB) ke R2
    └── booth/
        ├── constants/booth-presets.ts      # Preset layout (strip-4, strip-3), 5 filter, & 4 brand frame themes
        ├── schemas/booth.schema.ts         # Zod schemas: Presign, CreateSession, ShareDetail, Gallery
        ├── server/booth.server.ts          # createServerFn BFF untuk /api/v1/booth/*
        ├── services/r2-upload.service.ts   # Direct browser PUT Blob (image/webp, image/gif, image/png) ke R2
        ├── queries/booth.queries.ts        # queryOptions untuk /s/$shareCode & /api/v1/booth/gallery
        ├── engine/                         # (Detail lengkap di 05-CANVAS-ENGINE.md)
        │   ├── camera-controller.ts
        │   ├── center-crop.ts
        │   ├── pixel-filters.ts
        │   └── strip-compositor.ts
        ├── hooks/
        │   ├── use-booth-machine.ts
        │   ├── use-camera-stream.ts
        │   ├── use-countdown.ts
        │   └── use-share-strip.ts          # Orkestrasi: Presign -> Direct R2 PUT -> Confirm Session
        └── components/
            ├── booth-workspace.tsx
            ├── camera-stage.tsx
            ├── capture-tray.tsx
            ├── studio-editor.tsx
            ├── strip-preview-canvas.tsx
            ├── share-qr-dialog.tsx
            └── public-strip-viewer.tsx
```

---

## 2. Skema Validasi Zod (`booth.schema.ts`, `template.schema.ts`, `auth.schema.ts`)

### 2.1 `src/features/booth/schemas/booth.schema.ts`

```typescript
import { z } from 'zod'

export const LayoutTypeSchema = z.enum(['strip-4', 'strip-3'])
export type LayoutType = z.infer<typeof LayoutTypeSchema>

export const FilterPresetSchema = z.enum([
  'normal',
  'bw-classic',
  'warm-vintage',
  'cool-editorial',
  'sepia-aged',
])
export type FilterPreset = z.infer<typeof FilterPresetSchema>

export const FrameThemeSchema = z.enum([
  'obsidian-dark',
  'crisp-white',
  'acid-lime',
  'electric-lavender',
])
export type FrameTheme = z.infer<typeof FrameThemeSchema>

/** 1. POST /api/v1/booth/presign */
export const BoothPresignInputSchema = z.object({
  content_type: z
    .enum(['image/webp', 'image/jpeg', 'image/png'])
    .default('image/webp'),
  layout_type: LayoutTypeSchema,
  include_gif: z.boolean().default(false),
})
export type BoothPresignInput = z.infer<typeof BoothPresignInputSchema>

export const BoothPresignDataSchema = z.object({
  share_code: z.string(),
  storage_key: z.string(),
  image_upload_url: z.string().url(),
  image_public_url: z.string().url(),
  gif_storage_key: z.string().optional(),
  gif_upload_url: z.string().url().optional(),
  gif_public_url: z.string().url().optional(),
})
export type BoothPresignData = z.infer<typeof BoothPresignDataSchema>

/** 2. POST /api/v1/booth/sessions */
export const CreateBoothSessionInputSchema = z.object({
  share_code: z.string().min(4).max(16),
  storage_key: z.string().min(1),
  image_url: z.string().url(),
  gif_url: z.string().url().optional(),
  layout_type: LayoutTypeSchema,
  frame_theme: FrameThemeSchema,
  template_id: z.string().uuid().optional(),
  is_public: z.boolean().default(false),
})
export type CreateBoothSessionInput = z.infer<
  typeof CreateBoothSessionInputSchema
>

export const CreateBoothSessionDataSchema = z.object({
  id: z.string().uuid(),
  share_code: z.string(),
  expires_at: z.string(),
})
export type CreateBoothSessionData = z.infer<
  typeof CreateBoothSessionDataSchema
>

/** 3. GET /api/v1/booth/sessions/:shareCode */
export const GetBoothSessionInputSchema = z.object({
  shareCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{4,16}$/, 'Invalid share code format'),
})

export const BoothSessionDetailSchema = z.object({
  share_code: z.string(),
  image_url: z.string().url(),
  gif_url: z.string().optional(),
  layout_type: LayoutTypeSchema,
  frame_theme: FrameThemeSchema,
  creator_credit: z.string().optional(),
  created_at: z.string(),
  expires_at: z.string(),
})
export type BoothSessionDetail = z.infer<typeof BoothSessionDetailSchema>

/** 4. GET /api/v1/booth/gallery */
export const GalleryQueryInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
})

/** Envelope standar boilerpad-go-service */
export interface GoApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  error: unknown
}
```

### 2.2 `src/features/template/schemas/template.schema.ts`

```typescript
import { z } from 'zod'
import { LayoutTypeSchema } from '@/features/booth/schemas/booth.schema'

export const TemplateCategorySchema = z.enum(['official', 'community'])
export const TemplateStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'featured',
])

export const ListTemplatesInputSchema = z.object({
  layout: LayoutTypeSchema.optional(),
  category: TemplateCategorySchema.optional(),
  sort: z.enum(['popular', 'newest']).default('popular'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
})

export const TemplatePresignInputSchema = z.object({
  content_type: z.literal('image/png'),
  layout_type: LayoutTypeSchema,
})

export const CreateTemplateInputSchema = z.object({
  title: z.string().trim().min(2).max(100),
  layout_type: LayoutTypeSchema,
  storage_key: z.string().min(1),
  overlay_url: z.string().url(),
  thumbnail_url: z.string().url(),
})

export const UpdateTemplateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(100),
})

export const ModerateTemplateInputSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'featured']),
})
```

---

## 3. Spesifikasi TanStack Start Server Functions (`createServerFn`)

Seluruh komunikasi ke Go Fiber (`/api/v1/*`) melewati Server Functions yang berjalan di Cloudflare Worker, sehingga `X-API-SECRET` tidak pernah bocor ke browser.

### 3.1 Helper Server Fetch (`src/lib/api/server-fetch.ts`)

```typescript
import type { GoApiEnvelope } from '@/features/booth/schemas/booth.schema'

export interface ServerFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  accessToken?: string
}

/**
 * Helper yang HANYA dipanggil di dalam .handler() pada createServerFn.
 * Membaca process.env.API_SECRET per-request sesuai aturan Cloudflare Workers.
 */
export async function goServiceFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const apiSecret = process.env.API_SECRET
  const rawBaseUrl =
    process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || ''
  const baseUrl = rawBaseUrl.replace(/\/+$/, '')

  if (!apiSecret) {
    throw new Error('Server configuration error: missing API_SECRET')
  }
  if (!baseUrl) {
    throw new Error('Server configuration error: missing API_BASE_URL')
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-SECRET': apiSecret,
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const payload = (await response.json()) as GoApiEnvelope<T>
  if (!response.ok || !payload.success) {
    throw new Error(
      payload.message || `API request failed (${response.status})`,
    )
  }

  return payload.data
}
```

### 3.2 Booth BFF Server Functions (`src/features/booth/server/booth.server.ts`)

```typescript
import { createServerFn } from '@tanstack/react-start'
import { goServiceFetch } from '@/lib/api/server-fetch'
import {
  BoothPresignInputSchema,
  CreateBoothSessionInputSchema,
  GalleryQueryInputSchema,
  GetBoothSessionInputSchema,
  type BoothPresignData,
  type BoothSessionDetail,
  type CreateBoothSessionData,
  type GoApiEnvelope,
} from '../schemas/booth.schema'

/** 1. POST /api/v1/booth/presign */
export const presignBoothUploadFn = createServerFn({ method: 'POST' })
  .validator(BoothPresignInputSchema)
  .handler(async ({ data }): Promise<BoothPresignData> => {
    return goServiceFetch<BoothPresignData>('/api/v1/booth/presign', {
      method: 'POST',
      body: data,
    })
  })

/** 2. POST /api/v1/booth/sessions */
export const createBoothSessionFn = createServerFn({ method: 'POST' })
  .validator(CreateBoothSessionInputSchema)
  .handler(async ({ data }): Promise<CreateBoothSessionData> => {
    return goServiceFetch<CreateBoothSessionData>('/api/v1/booth/sessions', {
      method: 'POST',
      body: data,
    })
  })

export type SharedSessionLookupResult =
  | { status: 'found'; session: BoothSessionDetail }
  | { status: 'expired'; shareCode: string }
  | { status: 'not_found'; shareCode: string }

/** 3. GET /api/v1/booth/sessions/:shareCode */
export const getBoothSessionByCodeFn = createServerFn({ method: 'GET' })
  .validator(GetBoothSessionInputSchema)
  .handler(async ({ data }): Promise<SharedSessionLookupResult> => {
    const apiSecret = process.env.API_SECRET
    const baseUrl = (
      process.env.API_BASE_URL ||
      process.env.VITE_API_BASE_URL ||
      ''
    ).replace(/\/+$/, '')

    const response = await fetch(
      `${baseUrl}/api/v1/booth/sessions/${encodeURIComponent(data.shareCode)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-API-SECRET': apiSecret ?? '',
        },
      },
    )

    if (response.status === 410) {
      return { status: 'expired', shareCode: data.shareCode }
    }
    if (response.status === 404) {
      return { status: 'not_found', shareCode: data.shareCode }
    }

    const payload =
      (await response.json()) as GoApiEnvelope<BoothSessionDetail>
    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(payload.message || 'Failed to fetch photo session')
    }

    return { status: 'found', session: payload.data }
  })

/** 4. GET /api/v1/booth/gallery */
export const getPublicGalleryFn = createServerFn({ method: 'GET' })
  .validator(GalleryQueryInputSchema)
  .handler(async ({ data }) => {
    const qs = new URLSearchParams({
      page: String(data.page),
      limit: String(data.limit),
    })
    return goServiceFetch<{
      items: BoothSessionDetail[]
      meta: { page: number; limit: number; total_items: number }
    }>(`/api/v1/booth/gallery?${qs.toString()}`)
  })
```

---

## 4. Hook Orkestrasi Unggah & QR Share (`src/features/booth/hooks/use-share-strip.ts`)

Mengorkestrasi alur 3-langkah (`POST /api/v1/booth/presign` -> Direct Browser `PUT` ke Cloudflare R2 -> `POST /api/v1/booth/sessions`):

```typescript
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  createBoothSessionFn,
  presignBoothUploadFn,
} from '../server/booth.server'
import { uploadBlobToR2 } from '../services/r2-upload.service'
import type {
  CreateBoothSessionData,
  FrameTheme,
  LayoutType,
} from '../schemas/booth.schema'

export type ShareUploadStep =
  | 'idle'
  | 'presigning'
  | 'uploading'
  | 'confirming'
  | 'done'
  | 'error'

export interface ShareStripPayload {
  imageBlob: Blob
  gifBlob?: Blob | null
  layoutType: LayoutType
  frameTheme: FrameTheme
  templateId?: string
  isPublic?: boolean
}

export function useShareStrip() {
  const [step, setStep] = useState<ShareUploadStep>('idle')

  const mutation = useMutation({
    mutationFn: async (
      payload: ShareStripPayload,
    ): Promise<CreateBoothSessionData & { imageUrl: string }> => {
      setStep('presigning')
      const contentType =
        payload.imageBlob.type === 'image/png'
          ? 'image/png'
          : payload.imageBlob.type === 'image/jpeg'
            ? 'image/jpeg'
            : 'image/webp'

      const presigned = await presignBoothUploadFn({
        data: {
          content_type: contentType,
          layout_type: payload.layoutType,
          include_gif: Boolean(payload.gifBlob),
        },
      })

      setStep('uploading')
      await uploadBlobToR2({
        uploadUrl: presigned.image_upload_url,
        blob: payload.imageBlob,
        headers: { 'Content-Type': contentType },
      })

      if (payload.gifBlob && presigned.gif_upload_url) {
        await uploadBlobToR2({
          uploadUrl: presigned.gif_upload_url,
          blob: payload.gifBlob,
          headers: { 'Content-Type': 'image/gif' },
        })
      }

      setStep('confirming')
      const confirmed = await createBoothSessionFn({
        data: {
          share_code: presigned.share_code,
          storage_key: presigned.storage_key,
          image_url: presigned.image_public_url,
          gif_url: presigned.gif_public_url,
          layout_type: payload.layoutType,
          frame_theme: payload.frameTheme,
          template_id: payload.templateId,
          is_public: payload.isPublic ?? false,
        },
      })

      setStep('done')
      return {
        ...confirmed,
        imageUrl: presigned.image_public_url,
      }
    },
    onError: () => {
      setStep('error')
    },
  })

  return {
    ...mutation,
    step,
    resetStep: () => setStep('idle'),
  }
}
```

---

## 5. Spesifikasi Route TanStack Start (`src/routes/`)

### 5.1 Route `/booth` — Client-Only Photobooth Studio (`src/routes/booth.tsx`)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { BoothWorkspace } from '@/features/booth/components/booth-workspace'

export const Route = createFileRoute('/booth')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Studio Booth — MyPhotoBut' },
      {
        name: 'description',
        content:
          'Capture 3 or 4 photobooth poses with Safari-safe film filters, community frames, and instant QR share.',
      },
    ],
  }),
  component: BoothWorkspace,
})
```

### 5.2 Route `/s/$shareCode` — Full SSR & Dynamic OpenGraph (`src/routes/s.$shareCode.tsx`)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getBoothSessionByCodeFn } from '@/features/booth/server/booth.server'
import { PublicStripViewer } from '@/features/booth/components/public-strip-viewer'

export const Route = createFileRoute('/s/$shareCode')({
  loader: async ({ params }) => {
    return getBoothSessionByCodeFn({
      data: { shareCode: params.shareCode },
    })
  },
  head: ({ loaderData, params }) => {
    if (!loaderData || loaderData.status !== 'found') {
      return {
        meta: [
          { title: `Photo Strip #${params.shareCode} — MyPhotoBut` },
          {
            name: 'description',
            content: 'This photo strip has expired or does not exist.',
          },
          { name: 'robots', content: 'noindex, nofollow' },
        ],
      }
    }

    const { session } = loaderData
    const title = session.creator_credit
      ? `Photo Strip #${session.share_code} (Frame by ${session.creator_credit}) — MyPhotoBut`
      : `Studio Photo Strip #${session.share_code} — MyPhotoBut`
    const description = `Captured in MyPhotoBut (${session.layout_type} • ${session.frame_theme}). Scan or open to download high-res photo strip.`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: 'noindex, nofollow' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: session.image_url },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: session.image_url },
      ],
    }
  },
  component: SharedStripRouteComponent,
})

function SharedStripRouteComponent() {
  const result = Route.useLoaderData()
  return <PublicStripViewer result={result} />
}
```
