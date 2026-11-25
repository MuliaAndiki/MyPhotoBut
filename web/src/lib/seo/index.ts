import { appConfig } from '@/config/app.config'
import { env } from '@/lib/env'

export interface PageSeoInput {
  title?: string
  description?: string
  path?: string
  image?: string
  keywords?: string[]
  noIndex?: boolean
  type?: 'website' | 'article'
}

export function resolveAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }
  const normalizedPath = pathOrUrl.startsWith('/')
    ? pathOrUrl
    : `/${pathOrUrl}`
  return `${env.SITE_URL}${normalizedPath}`
}

/**
 * Builds Schema.org JSON-LD @graph for GEO (Generative Engine Optimization)
 * and Google Search Rich Results: Organization, WebSite, WebApplication, and FAQPage.
 */
export function buildGeoJsonLdGraph() {
  const siteUrl = env.SITE_URL
  const logoUrl = resolveAbsoluteUrl(appConfig.logo)
  const ogImageUrl = resolveAbsoluteUrl(appConfig.metadata.image)
  const socialLinks = Object.values(appConfig.social_media)
    .map((item) => item.url)
    .filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: appConfig.name,
        url: siteUrl,
        email: appConfig.email,
        description: appConfig.description,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
        },
        sameAs: socialLinks,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: appConfig.name,
        alternateName: appConfig.tagline,
        description: appConfig.metadata.description,
        inLanguage: ['id-ID', 'en-US'],
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#webapp`,
        name: appConfig.name,
        url: siteUrl,
        image: ogImageUrl,
        description: appConfig.metadata.description,
        applicationCategory: 'PhotographyApplication',
        operatingSystem: 'All (Web Browser: Chrome, Safari, iOS, Android)',
        browserRequirements:
          'Requires HTML5 Canvas 2D and WebRTC getUserMedia camera access',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        featureList: [
          '100% Zero-Login Guest Web Photobooth (3-Pose & 4-Pose Vertical Strips)',
          'Safari & iOS-Safe Pixel Manipulation Film Filters (Ilford B&W, Kodak Warm, Cinestill Cool, Sepia)',
          'Official & Community Creator Transparent PNG Frame Overlays',
          'High-Resolution 300 DPI Print-Ready Photo Strip Export (WebP, PNG, JPEG, GIF)',
          'Instant QR Code Photo Strip Sharing via Cloudflare R2',
        ],
        author: {
          '@id': `${siteUrl}/#organization`,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Apakah menggunakan MyPhotoBut memerlukan login atau instalasi aplikasi?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tidak. MyPhotoBut berjalan 100% langsung di browser desktop maupun smartphone tanpa perlu login atau menginstal aplikasi. Cukup izinkan kamera, ambil 3 atau 4 pose, pilih filter film dan frame, lalu unduh atau pindai QR Code.',
            },
          },
          {
            '@type': 'Question',
            name: 'Apakah filter warna MyPhotoBut berfungsi di Safari iPhone dan iPad?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ya. MyPhotoBut menggunakan mesin manipulasi piksel Canvas 2D murni (getImageData + Look-Up Table) tanpa bergantung pada ctx.filter, sehingga hasil warna filter 100% identik di Chrome, macOS Safari, dan iOS Safari.',
            },
          },
          {
            '@type': 'Question',
            name: 'Bagaimana cara kreator mengunggah desain frame photobooth mereka sendiri?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Kreator dapat login tanpa password menggunakan Email Magic Link atau Google OAuth 2.0 untuk mengunggah file frame PNG transparan ke katalog komunitas dan menampilkan kredit @username mereka pada setiap foto.',
            },
          },
        ],
      },
    ],
  }
}

/**
 * Generates standard SEO meta tags, OpenGraph, Twitter Cards, and Google Search Console
 * verification tags from AppConfig.
 */
export function buildSeoMeta(input: PageSeoInput = {}) {
  const title = input.title ?? appConfig.metadata.title
  const description = input.description ?? appConfig.metadata.description
  const canonicalUrl = resolveAbsoluteUrl(input.path ?? '/')
  const ogImageUrl = resolveAbsoluteUrl(
    input.image ?? appConfig.metadata.image,
  )
  const keywords = (input.keywords ?? appConfig.metadata.keywords).join(', ')
  const robotsContent = input.noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

  const meta: Array<Record<string, string>> = [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'author', content: appConfig.metadata.author },
    { name: 'application-name', content: appConfig.name },
    { name: 'apple-mobile-web-app-title', content: appConfig.name },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
    { name: 'robots', content: robotsContent },
    { name: 'googlebot', content: robotsContent },
    // Dual-Theme Status Bar Colors (#FFFFFF light / #181818 dark)
    {
      name: 'theme-color',
      content: '#FFFFFF',
      media: '(prefers-color-scheme: light)',
    },
    {
      name: 'theme-color',
      content: '#181818',
      media: '(prefers-color-scheme: dark)',
    },
    // OpenGraph Tags
    { property: 'og:type', content: input.type ?? 'website' },
    { property: 'og:site_name', content: appConfig.name },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:image', content: ogImageUrl },
    { property: 'og:image:alt', content: `${appConfig.name} — ${appConfig.tagline}` },
    { property: 'og:locale', content: 'id_ID' },
    { property: 'og:locale:alternate', content: 'en_US' },
    // Twitter / X Card Tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImageUrl },
  ]

  if (env.GOOGLE_SITE_VERIFICATION) {
    meta.push({
      name: 'google-site-verification',
      content: env.GOOGLE_SITE_VERIFICATION,
    })
  }

  return {
    meta,
    canonicalUrl,
  }
}
