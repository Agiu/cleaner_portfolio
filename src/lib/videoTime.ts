// Where each video was last at, by src, so a video started by hovering a card carries on from
// the same frame in the case study hero instead of starting over.
const times = new Map<string, number>()

export const saveVideoTime = (v: HTMLVideoElement) => times.set(v.getAttribute('src') ?? '', v.currentTime)

/** Seek a freshly loaded video to wherever its src was last left, or else to its data-start
 *  (the frame its cover still was taken from, so playback picks up from the still). */
export function restoreVideoTime(v: HTMLVideoElement) {
  const t = times.get(v.getAttribute('src') ?? '') ?? Number(v.dataset.start ?? 0)
  if (t && Number.isFinite(v.duration) && t < v.duration) v.currentTime = t
}
