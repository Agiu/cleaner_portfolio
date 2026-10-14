import type { SVGProps } from 'react'

/*
 * Glyphs drawn inside the ForeFlight mock-ups, exactly as the Figma file exports them
 * (Font Awesome's plane-departure; Akar's book-open, circle-check and close; boxicons' link),
 * with currentColor in place of the exported fills so the stylesheet can tint them.
 */

type IconProps = { className?: string }

export function PlaneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 15.0003 12" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M14.6251 10.5H0.375067C0.167879 10.5 6.6625e-05 10.6678 6.6625e-05 10.875V11.625C6.6625e-05 11.8322 0.167879 12 0.375067 12H14.6251C14.8323 12 15.0001 11.8322 15.0001 11.625V10.875C15.0001 10.6678 14.8323 10.5 14.6251 10.5ZM1.88796 7.99852C2.03514 8.15883 2.24186 8.24977 2.45819 8.24953L5.51772 8.24531C5.75918 8.24501 5.99716 8.18784 6.21241 8.07844L13.0318 4.61789C13.6585 4.29984 14.2203 3.84586 14.6026 3.25125C15.0317 2.58375 15.0783 2.1007 14.9089 1.75945C14.7399 1.41797 14.3291 1.16719 13.5437 1.11609C12.8441 1.07062 12.1482 1.25484 11.5215 1.57266L9.21264 2.7443L4.08686 0.821016C4.02523 0.7795 3.95363 0.7552 3.87946 0.750626C3.8053 0.746052 3.73125 0.761371 3.66499 0.795L2.12397 1.57711C1.87389 1.70391 1.81343 2.03766 2.0028 2.24578L5.66421 4.545L3.24522 5.77266L1.54952 4.91789C1.4911 4.88843 1.42657 4.87312 1.36114 4.8732C1.29572 4.87328 1.23122 4.88875 1.17288 4.91836L0.232332 5.39578C-0.0123552 5.52 -0.0768084 5.84391 0.101785 6.05391L1.88796 7.99852Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M8 13.3333C8 13.3333 9 12.6667 11.3333 12.6667C13.6667 12.6667 14.6667 13.3333 14.6667 13.3333V4C14.6667 4 13.6667 2.66667 11.3333 2.66667C9 2.66667 8 4 8 4C8 4 7 2.66667 4.66667 2.66667C2.33333 2.66667 1.33333 4 1.33333 4V13.3333C1.33333 13.3333 2.33333 12.6667 4.66667 12.6667C7 12.6667 8 13.3333 8 13.3333ZM8 4V13.3333"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 15.3333 15.3333" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M5 8L7 10L10.3333 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M7.66667 14.3333C11.3486 14.3333 14.3333 11.3486 14.3333 7.66667C14.3333 3.98477 11.3486 1 7.66667 1C3.98477 1 1 3.98477 1 7.66667C1 11.3486 3.98477 14.3333 7.66667 14.3333Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 11 11" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M5.5 0C8.53757 0 11 2.46243 11 5.5C11 8.53757 8.53757 11 5.5 11C2.46243 11 0 8.53757 0 5.5C0 2.46243 2.46243 0 5.5 0ZM7.99219 2.70215C7.79691 2.50705 7.48036 2.50694 7.28516 2.70215L5.34668 4.63965L3.40918 2.70215C3.21392 2.50689 2.89741 2.50689 2.70215 2.70215C2.50689 2.89741 2.50689 3.21392 2.70215 3.40918L4.63965 5.34668L2.70215 7.28516C2.50694 7.48036 2.50705 7.79691 2.70215 7.99219C2.89742 8.18732 3.21396 8.18741 3.40918 7.99219L5.34668 6.05371L7.28516 7.99219C7.48043 8.18732 7.79697 8.18741 7.99219 7.99219C8.18741 7.79697 8.18732 7.48043 7.99219 7.28516L6.05371 5.34668L7.99219 3.40918C8.18741 3.21396 8.18732 2.89742 7.99219 2.70215Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** boxicons:link, drawn at 45° in the file (the stylesheet applies the rotation). */
export function LinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M4.11667 7.65C3.88229 7.88408 3.56458 8.01557 3.23333 8.01557C2.90208 8.01557 2.58438 7.88408 2.35 7.65C2.11592 7.41562 1.98443 7.09792 1.98443 6.76667C1.98443 6.43542 2.11592 6.11771 2.35 5.88333L3.52917 4.70417L2.94167 4.11667L1.7625 5.29583C1.37224 5.68668 1.15305 6.21643 1.15305 6.76875C1.15305 7.32107 1.37224 7.85082 1.7625 8.24167C2.17083 8.64583 2.7 8.85 3.2375 8.85C3.775 8.85 4.30417 8.64583 4.7125 8.24167L5.89167 7.0625L5.30417 6.475L4.125 7.65417L4.11667 7.65ZM5.29583 1.75833L4.11667 2.9375L4.70417 3.525L5.88333 2.34583C6.11771 2.11175 6.43542 1.98027 6.76667 1.98027C7.09792 1.98027 7.41563 2.11175 7.65 2.34583C7.88408 2.58021 8.01557 2.89792 8.01557 3.22917C8.01557 3.56042 7.88408 3.87812 7.65 4.1125L6.47083 5.29167L7.05833 5.87917L8.2375 4.7C8.62776 4.30915 8.84695 3.77941 8.84695 3.22708C8.84695 2.67476 8.62776 2.14501 8.2375 1.75417C7.84666 1.36391 7.31691 1.14471 6.76458 1.14471C6.21226 1.14471 5.68251 1.36391 5.29167 1.75417L5.29583 1.75833Z"
        fill="currentColor"
      />
      <path
        d="M7.0625 3.525L6.76667 3.23333L6.475 2.9375L4.70417 4.70417L2.9375 6.475L3.23333 6.76667L3.525 7.0625L5.29583 5.29583L7.0625 3.525Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 5.50001 3.64052" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M0.250006 0.250006L2.75001 3.25001L5.25001 0.250006" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
    </svg>
  )
}

/* Plain stroked marks for the logbook dialogs: × to dismiss, ✓ for the first pass's confirmation,
   + to link, and a broken chain on a linked row (the link that's there, and what a press does to it). */

export function CloseGlyph() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
      <path d="M1.5 1.5 L10.5 10.5 M10.5 1.5 L1.5 10.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function CheckGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M8 2.5 L8 13.5 M2.5 8 L13.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function UnlinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M18.8 12.3 L20.5 10.5 A5 5 0 0 0 13.5 3.5 L11.8 5.2 M5.2 11.7 L3.5 13.5 A5 5 0 0 0 10.5 20.5 L12.2 18.8 M8 2 L8 5 M2 8 L5 8 M16 19 L16 22 M19 16 L22 16"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
