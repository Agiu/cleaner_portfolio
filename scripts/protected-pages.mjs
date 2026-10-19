import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto'

/*
 * Password-protected case studies on a static site. Each page in `dir` (src/content/protected),
 * its Markdown plus the sidebar details in a .json beside it (summary, outcomes, advisors…), is
 * encrypted at build time with its password, from CASE_STUDY_PASSWORD_<SLUG> in the env
 * (.env.local, or the host's build settings), and only the ciphertext ships, as the virtual
 * module `virtual:protected-pages`. The browser decrypts it with the password a visitor enters
 * (src/lib/protectedPages.ts). Without the password the Markdown can't be read from the bundle.
 *
 * AES-256-GCM, its key from PBKDF2-SHA-256 over the password with a fresh random salt each build.
 * Change a study's password by changing its env var and rebuilding.
 */

const ID = 'virtual:protected-pages'
const RESOLVED = `\0${ID}`
export const ITERATIONS = 250_000

const b64 = (buf) => Buffer.from(buf).toString('base64')

/** @param {{ dir: string, env: Record<string, string> }} options */
export function protectedPages({ dir, env }) {
  return {
    name: 'protected-pages',
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return
      const pages = {}
      for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
        const slug = file.slice(0, -3)
        const path = resolve(dir, file) // absolute, or the dev server reads it as an import
        const detailsPath = resolve(dir, `${slug}.json`)
        this.addWatchFile(path)
        if (existsSync(detailsPath)) this.addWatchFile(detailsPath)
        const key = `CASE_STUDY_PASSWORD_${slug.toUpperCase().replace(/-/g, '_')}`
        const password = env[key]
        if (!password) {
          this.warn(`${key} isn't set, so the ${slug} case study can't be unlocked.`)
          pages[slug] = null
          continue
        }
        const salt = randomBytes(16)
        const iv = randomBytes(12)
        const cipher = createCipheriv('aes-256-gcm', pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256'), iv)
        // Web Crypto expects GCM's tag on the end of the ciphertext.
        const plain = JSON.stringify({
          page: readFileSync(path, 'utf8'),
          details: existsSync(detailsPath) ? JSON.parse(readFileSync(detailsPath, 'utf8')) : {},
        })
        const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final(), cipher.getAuthTag()])
        pages[slug] = { salt: b64(salt), iv: b64(iv), data: b64(data), iterations: ITERATIONS }
      }
      return `export default ${JSON.stringify(pages)}`
    },
  }
}
