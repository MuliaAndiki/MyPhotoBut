import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

/**
 * Provides the root route manifest entry for `tanstack-start:start-manifest-plugin`
 * when using Code-Based Routing (`enableRouteGeneration: false`).
 */
function codeBasedStartManifestPlugin(): Plugin {
  const rootFilePath = path
    .resolve(process.cwd(), 'src/router/root.tsx')
    .replace(/\\/g, '/')

  const ensureManifest = () => {
    ;(globalThis as Record<string, unknown>).TSS_ROUTES_MANIFEST ??= {
      __root__: {
        filePath: rootFilePath,
        children: [],
      },
    }
  }

  ensureManifest()

  return {
    name: 'myphotobut:code-based-start-manifest',
    enforce: 'pre',
    configResolved() {
      ensureManifest()
    },
    buildStart() {
      ensureManifest()
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    codeBasedStartManifestPlugin(),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      router: {
        enableRouteGeneration: false,
      },
    }),
    viteReact(),
  ],
})

export default config
