import type { Plugin } from 'vite'

export declare const ITERATIONS: number
export declare function protectedPages(options: { dir: string; env: Record<string, string> }): Plugin
