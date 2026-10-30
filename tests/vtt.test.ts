import { describe, expect, it } from 'vitest'
import { cuesAt, parseVtt } from '../src/player/vtt'
import { ensureTimestampMap, formatTimestamp, spanSingleCue, subtitleTextFromVtt } from '../src/pipeline/vtt-file'

const sample = `WEBVTT

NOTE Henry Adams Bellows, 1923. Public domain.

1
00:00:00.000 --> 00:00:15.000
Within the gates | ere a man shall go,
(Full warily let him watch,)
`

describe('webvtt', () => {
  it('reads one cue and ignores notes and cue ids', () => {
    const cues = parseVtt(sample)
    expect(cues).toHaveLength(1)
    expect(cues[0].start).toBe(0)
    expect(cues[0].end).toBe(15)
    expect(cues[0].text).toContain('Within the gates')
    expect(subtitleTextFromVtt(sample)).toBe(cues[0].text)
  })

  it('keeps the cue visible from the first frame through the last', () => {
    const cues = parseVtt(sample)
    expect(cuesAt(cues, 0).map((cue) => cue.text).join('\n')).toContain('Within the gates')
    expect(cuesAt(cues, 15)).toHaveLength(1)
    expect(cuesAt(cues, 15.01)).toHaveLength(0)
  })

  it('adds the timestamp map Safari wants and can stretch one cue to the media end', () => {
    const stretched = spanSingleCue(sample, 15.02)
    const mapped = ensureTimestampMap(stretched)
    expect(mapped).toContain('X-TIMESTAMP-MAP=MPEGTS:0,LOCAL:00:00:00.000')
    expect(parseVtt(mapped)[0].end).toBeCloseTo(15.02, 3)
    expect(formatTimestamp(15)).toBe('00:00:15.000')
  })

  it('refuses to rewrite a file that already has several cues', () => {
    const multi = `WEBVTT

00:00:00.000 --> 00:00:05.000
One

00:00:05.000 --> 00:00:10.000
Two
`
    expect(() => spanSingleCue(multi, 10)).toThrow(/exactly one/)
  })
})
