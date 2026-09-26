// Images whose entrance reveal has already played this visit. Module state, so it survives
// route changes and remounts but resets on a real page reload.
const played = new Set<string>()

export const hasRevealed = (key: string | undefined) => (key ? played.has(key) : false)

export const markRevealed = (key: string | undefined) => {
  if (key) played.add(key)
}
