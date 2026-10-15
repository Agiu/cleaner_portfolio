import type { ComponentType } from 'react'
import { AutotrophSite } from './AutotrophSite'
import { WosSite } from './WosSite'

/** Case study heroes that are scenes rather than an image or video, by slug. Laid over the
 *  study's still image on its case study page. */
export const heroScenes: Record<string, ComponentType> = {
  autotroph: AutotrophSite,
  wos: WosSite,
}
