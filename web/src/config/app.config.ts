export interface AppConfig {
  name: string
  tagline: string
  description: string
  logo: string
  email: string
  metadata: {
    title: string
    description: string
    keywords: string[]
    author: string
    image: string
  }
  social_media: {
    twitter: { url: string; icon: string }
    instagram: { url: string; icon: string }
    linkedin: { url: string; icon: string }
    youtube: { url: string; icon: string }
    tiktok: { url: string; icon: string }
  }
}

export const appConfig: AppConfig = {
  name: 'MyPhotoBut',
  tagline: 'Tactile Analog Web Photobooth & Community Frame Studio.',
  description:
    'Online studio photobooth modern tanpa login. Ambil 3–4 pose via webcam dengan filter film Safari-safe, pilih frame eksklusif kreator komunitas, dan bagikan hasil photo strip 300 DPI secara instan via QR Code.',
  logo: '/favicon.svg',
  email: 'hello@myphotobut.com',
  metadata: {
    title: 'MyPhotoBut — Online Studio Photobooth & Instant QR Photo Strip',
    description:
      'Capture 3 or 4 studio photobooth poses directly in your browser. Apply Safari-safe analog film pixel filters, community PNG frames, and download 300 DPI photo strips or share instantly via QR Code.',
    keywords: [
      'online photobooth',
      'web photobooth',
      'photo strip generator',
      'virtual photobooth',
      'photobooth qr code',
      'analog film photobooth',
      'webcam photo booth',
      'korean photobooth online',
      'custom photo frame studio',
      'photobooth tanpa login',
      'myphotobut',
    ],
    author: 'MyPhotoBut Studio',
    image: '/og-image.png',
  },
  social_media: {
    twitter: {
      url: 'https://x.com/myphotobut',
      icon: 'twitter',
    },
    instagram: {
      url: 'https://instagram.com/myphotobut',
      icon: 'instagram',
    },
    linkedin: {
      url: 'https://linkedin.com/company/myphotobut',
      icon: 'linkedin',
    },
    youtube: {
      url: 'https://youtube.com/@myphotobut',
      icon: 'youtube',
    },
    tiktok: {
      url: 'https://tiktok.com/@myphotobut',
      icon: 'tiktok',
    },
  },
}
