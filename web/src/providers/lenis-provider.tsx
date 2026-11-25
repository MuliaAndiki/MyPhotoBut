import { useLocation } from '@tanstack/react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ReactLenis, useLenis } from 'lenis/react'
import { type ReactNode, useEffect } from 'react'

interface LenisProviderProps {
  children: ReactNode
}

// Component to sync Lenis with GSAP ScrollTrigger
function ScrollTriggerSync() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger)

    // Update ScrollTrigger on Lenis scroll
    lenis.on('scroll', ScrollTrigger.update)

    // Set up GSAP ticker to sync with Lenis
    const updateRaf = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(updateRaf)

    // Disable Lenis internal RAF since GSAP handles it
    gsap.ticker.lagSmoothing(0)

    // Refresh ScrollTrigger after setup
    ScrollTrigger.refresh()

    return () => {
      lenis.off('scroll', ScrollTrigger.update)
      gsap.ticker.remove(updateRaf)
    }
  }, [lenis])

  return null
}

export function LenisProvider({ children }: LenisProviderProps) {
  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  // Lenis smooth-scrolling di-mount ke window (root). Pada antarmuka platform / studio / dashboard internal
  // (misal /booth, /developer, /superadmin, /user, /dashboard) maupun auth dan modal flow, layout utama
  // dibungkus oleh AppShell dengan fixed viewport (h-dvh overflow-hidden) dan scrolling terjadi
  // di dalam container <main className="overflow-y-auto">. Menjalankan Lenis di window pada rute-rute ini
  // akan membajak wheel event dan memblokir native scroll container.
  const isAppOrPrivate =
    !pathname ||
    pathname.startsWith('/booth') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/magic-link') ||
    pathname.startsWith('/join') ||
    pathname.startsWith('/addDoc')

  if (isAppOrPrivate) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
        autoRaf: false, // Disable auto RAF, let GSAP handle it
      }}
    >
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  )
}
