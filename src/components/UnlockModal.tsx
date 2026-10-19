import { useEffect, useRef, useState, type FormEvent } from 'react'
import { canUnlock, unlock } from '../lib/protectedPages'
import { useUnlockRequest } from '../lib/unlockGate'
import { getLenis } from '../lib/useSmoothScroll'
import { SheetMarks } from './SheetMarks'

/**
 * The password modal for a protected case study (lib/unlockGate.ts): over the page, on the dark
 * drawing sheet, with the study's title, the password field and any error. Escape, the close
 * button or a click on the backdrop dismisses it.
 */
export function UnlockModal() {
  const request = useUnlockRequest()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!request) return
    setError('')
    getLenis()?.stop()
    input.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && request.done(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      getLenis()?.start()
    }
  }, [request])

  if (!request) return null
  const ready = canUnlock(request.slug)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    const ok = await unlock(request.slug, input.current?.value ?? '')
    setPending(false)
    if (ok) request.done(true)
    else {
      setError('That password isn’t right.')
      input.current?.select()
    }
  }

  return (
    <div className="unlock" data-lenis-prevent onMouseDown={(e) => e.target === e.currentTarget && request.done(false)}>
      <div className="sv-feature-panel study-gate-panel" role="dialog" aria-modal="true" aria-labelledby="unlock-title" aria-describedby="unlock-text">
        <SheetMarks />
        <button type="button" className="unlock-close" aria-label="Close" onClick={() => request.done(false)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        <div className="study-gate-body">
          <svg className="study-gate-lock" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="10.5" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <p className="study-gate-label">Password protected</p>
          <h2 id="unlock-title" className="study-gate-title">
            {request.title}
          </h2>
          <p id="unlock-text" className="study-gate-text">
            This write-up covers client work under NDA. Enter the password to read it.
          </p>
          {ready ? (
            <form className="study-gate-form" onSubmit={submit}>
              <input
                ref={input}
                type="password"
                name="password"
                required
                autoComplete="off"
                placeholder="Password"
                aria-label="Password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'unlock-error' : undefined}
                className="study-gate-input"
                onChange={() => error && setError('')}
              />
              <button type="submit" className="study-gate-submit" disabled={pending}>
                {pending ? 'Checking…' : 'Unlock'}
              </button>
            </form>
          ) : (
            <p className="study-gate-error">This case study can’t be unlocked yet.</p>
          )}
          {error && (
            <p id="unlock-error" className="study-gate-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
