import { useSyncExternalStore } from 'react'
import { unlockRemembered } from './protectedPages'

/*
 * Asks for a protected study's password: the unlock modal (components/UnlockModal.tsx, mounted
 * once in App) shows while a request is open. `requestUnlock` resolves true once the study is
 * unlocked (straight away, when this browser remembers its password) and false if the modal is
 * dismissed.
 */

type Request = { slug: string; title: string; done: (ok: boolean) => void }

let current: Request | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export async function requestUnlock(slug: string, title: string): Promise<boolean> {
  if (await unlockRemembered(slug)) return true
  current?.done(false)
  return new Promise((resolve) => {
    current = {
      slug,
      title,
      done: (ok) => {
        current = null
        emit()
        resolve(ok)
      },
    }
    emit()
  })
}

export const useUnlockRequest = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
