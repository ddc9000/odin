import { describe, expect, it } from 'vitest'
import { chooseEngine } from '../src/player/engine'

describe('playback engine', () => {
  it('uses native HLS where the browser claims MPEG-URL support', () => {
    expect(chooseEngine(() => 'maybe')).toBe('native')
    expect(chooseEngine(() => 'probably')).toBe('native')
  })

  it('uses hls.js where it does not', () => {
    expect(chooseEngine(() => '')).toBe('hls.js')
  })
})
