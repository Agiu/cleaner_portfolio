import type { ComponentType } from 'react'
import { ForeFlightCover } from './ForeFlightCover'
import { WosCover } from './WosCover'

/** Work page card covers that are built scenes rather than the study's image, by slug. */
export const coverScenes: Record<string, ComponentType> = {
  wos: WosCover,
  foreflight: ForeFlightCover,
}

/** Covers that spell out the study's title themselves, so a card shows no title over them. */
export const titledCovers = new Set(['wos'])
