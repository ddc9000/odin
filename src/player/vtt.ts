export interface Cue {
  start: number
  end: number
  text: string
}

const TIMING =
  /^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{1,3})\s+-->\s+(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{1,3})/

function stamp(hours: string | undefined, minutes: string, seconds: string, fraction: string): number {
  const ms = fraction.length === 3 ? Number(fraction) : Number(fraction.padEnd(3, '0'))
  return (hours ? Number(hours) : 0) * 3600 + Number(minutes) * 60 + Number(seconds) + ms / 1000
}

function isTiming(line: string): boolean {
  return TIMING.test(line.trim())
}

/**
 * A small WebVTT reader for what this site produces: a header, optional NOTE
 * blocks, and cues. It ignores style blocks and cue settings.
 */
export function parseVtt(input: string): Cue[] {
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = text.split('\n')
  if (!lines[0]?.trim().startsWith('WEBVTT')) {
    throw new Error('Subtitle file must start with WEBVTT')
  }

  let index = 1
  while (index < lines.length && lines[index].trim() !== '') index += 1
  index += 1

  const cues: Cue[] = []
  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === '') index += 1
    if (index >= lines.length) break

    if (lines[index].startsWith('NOTE') || lines[index].startsWith('STYLE') || lines[index].startsWith('REGION')) {
      while (index < lines.length && lines[index].trim() !== '') index += 1
      continue
    }

    let timingLine = lines[index].trim()
    if (!isTiming(timingLine) && index + 1 < lines.length && isTiming(lines[index + 1])) {
      index += 1
      timingLine = lines[index].trim()
    }
    const match = TIMING.exec(timingLine)
    if (!match) {
      index += 1
      continue
    }
    const start = stamp(match[1], match[2], match[3], match[4])
    const end = stamp(match[5], match[6], match[7], match[8])
    index += 1
    const body: string[] = []
    while (index < lines.length && lines[index].trim() !== '') {
      body.push(lines[index])
      index += 1
    }
    cues.push({ start, end, text: body.join('\n').replace(/\s+$/, '') })
  }

  return cues
}

/** Inclusive end so a cue that finishes exactly when the video does stays visible. */
export function cuesAt(cues: Cue[], time: number): Cue[] {
  if (!Number.isFinite(time) || time < 0) return []
  return cues.filter((cue) => time >= cue.start && time <= cue.end)
}
