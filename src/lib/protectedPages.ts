import pages from 'virtual:protected-pages'
import type { CaseStudySection } from './caseStudyMarkdown'

/*
 * The browser half of the password-protected case studies (scripts/protected-pages.mjs): a study's
 * page and sidebar details ship encrypted and are decrypted here with the password a visitor
 * enters in the unlock modal (components/UnlockModal.tsx). Once unlocked, a study stays open for
 * the visit, and the password is remembered in this browser so it opens straight away next time.
 */

export type Unlocked = { sections: CaseStudySection[]; details: Record<string, unknown> }

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
const storeKey = (slug: string) => `case-study-password:${slug}`
const open = new Map<string, Unlocked>()

export const isProtected = (slug: string) => Object.prototype.hasOwnProperty.call(pages, slug)

/** A protected study whose password was never set at build time can't be opened at all. */
export const canUnlock = (slug: string) => Boolean(pages[slug])

/** The study's page and details, if it's been unlocked this visit. */
export const unlocked = (slug: string) => open.get(slug)

function remember(slug: string, password: string | null) {
  try {
    if (password) localStorage.setItem(storeKey(slug), password)
    else localStorage.removeItem(storeKey(slug))
  } catch {
    // No storage (private window): it just won't be remembered.
  }
}

/** Unlocks the study if `password` is right; false if it isn't. */
export async function unlock(slug: string, password: string): Promise<boolean> {
  const page = pages[slug]
  if (!page || !password) return false
  try {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: bytes(page.salt), iterations: page.iterations, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    )
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(page.iv) }, key, bytes(page.data))
    const { page: markdown, details } = JSON.parse(new TextDecoder().decode(plain)) as { page: string; details: Record<string, unknown> }
    // Loaded here, not at the top: the parser's imports reach back to the study data, which needs
    // this module first.
    const { parseCaseStudy } = await import('./caseStudyMarkdown')
    open.set(slug, { sections: parseCaseStudy(markdown), details })
    remember(slug, password)
    return true
  } catch {
    return false // a wrong password fails GCM's check
  }
}

/** Unlocks the study with the password remembered in this browser, if there is one and it still works. */
export async function unlockRemembered(slug: string): Promise<boolean> {
  if (open.has(slug)) return true
  let saved: string | null = null
  try {
    saved = localStorage.getItem(storeKey(slug))
  } catch {
    return false
  }
  if (!saved) return false
  const ok = await unlock(slug, saved)
  if (!ok) remember(slug, null)
  return ok
}
