import type { Connect, PreviewServer, ViteDevServer } from 'vite'
import { defineConfig } from 'vitest/config'

const MEDIA_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.vtt': 'text/vtt',
}

function mediaType(url: string | undefined): string | undefined {
  const path = (url ?? '').split('?')[0]
  const dot = path.lastIndexOf('.')
  if (dot === -1) return undefined
  return MEDIA_TYPES[path.slice(dot)]
}

function redirectRootToBase(): import('vite').Plugin {
  const redirect: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url ?? ''
    if (url === '/' || url === '') {
      res.statusCode = 302
      res.setHeader('Location', '/odin/')
      res.end()
      return
    }
    next()
  }
  // Registered before Vite's static handler so it can replace an empty
  // Content-Type. Safari refuses an HLS playlist without this MIME type.
  // GitHub Pages already sends it via mime-db; this keeps local preview honest.
  const mime: Connect.NextHandleFunction = (req, res, next) => {
    const type = mediaType(req.url)
    if (type) {
      const setHeader = res.setHeader.bind(res)
      res.setHeader = ((name: string, value: number | string | readonly string[]) => {
        if (name.toLowerCase() === 'content-type') return setHeader(name, type)
        return setHeader(name, value)
      }) as typeof res.setHeader
      res.setHeader('Content-Type', type)
    }
    next()
  }
  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use(redirect)
    server.middlewares.use(mime)
  }
  return {
    name: 'odin-redirect-root',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

export default defineConfig({
  base: '/odin/',
  plugins: [redirectRootToBase()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
