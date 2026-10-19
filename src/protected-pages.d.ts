/** Encrypted case study pages (scripts/protected-pages.mjs); null when no password is set. */
declare module 'virtual:protected-pages' {
  const pages: Record<string, { salt: string; iv: string; data: string; iterations: number } | null>
  export default pages
}
