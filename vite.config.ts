import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { protectedPages } from './scripts/protected-pages.mjs'

/**
 * Prebuilt apps in public/ (e.g. public/who, Who Owns Seattle) serve their own index.html.
 * Static hosts do this for directory URLs; the dev server would otherwise fall back to the SPA.
 */
const publicAppIndexes = (dirs: string[]): Plugin => ({
  name: 'public-app-indexes',
  configureServer(server) {
    server.middlewares.use((req: { url?: string }, _res, next) => {
      const path = req.url?.split('?')[0]
      if (path && dirs.some((dir) => path === `/${dir}/`)) req.url = `${path}index.html`
      next()
    })
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    publicAppIndexes(['who', 'who/explore']),
    // Case studies behind a password: src/content/protected, keyed by CASE_STUDY_PASSWORD_<SLUG>.
    protectedPages({ dir: 'src/content/protected', env: loadEnv(mode, '.', 'CASE_STUDY_PASSWORD_') }),
  ],
  // maplibre's worker (the Who Owns Seattle hero) is an ES module that imports a shared chunk.
  worker: { format: 'es' },
}))
