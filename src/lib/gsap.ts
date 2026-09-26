import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

// Shared easing so every reveal on the page feels like the same hand.
gsap.defaults({ ease: 'expo.out', duration: 1.2 })

export { gsap, ScrollTrigger, SplitText, useGSAP }
