export type PlaybackEngine = 'native' | 'hls.js'

/**
 * iPhone and iPad Safari play HLS natively and do not support Media Source
 * Extensions, so hls.js cannot run there. Everywhere else we use hls.js.
 */
export function prefersNativeHls(canPlayType: (mime: string) => string): boolean {
  const support = canPlayType('application/vnd.apple.mpegurl')
  return support === 'probably' || support === 'maybe'
}

export function chooseEngine(canPlayType: (mime: string) => string): PlaybackEngine {
  return prefersNativeHls(canPlayType) ? 'native' : 'hls.js'
}
