import { parseVtt } from '../player/vtt.ts'

const TIMESTAMP_MAP = 'X-TIMESTAMP-MAP=MPEGTS:0,LOCAL:00:00:00.000'

export function formatTimestamp(seconds: number): string {
  const msTotal = Math.max(0, Math.round(seconds * 1000))
  const ms = msTotal % 1000
  const total = Math.floor(msTotal / 1000)
  const secs = total % 60
  const minutes = Math.floor(total / 60) % 60
  const hours = Math.floor(total / 3600)
  const pad = (value: number, width = 2) => String(value).padStart(width, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`
}

/**
 * Rewrite the single cue so it runs from 0 through `durationSec`.
 * Used when a stanza should stay on screen for the whole video.
 * Refuses multi-cue files so later, longer edits keep their own timing.
 */
export function spanSingleCue(vtt: string, durationSec: number): string {
  const cues = parseVtt(vtt)
  if (cues.length !== 1) throw new Error('--span-cue needs exactly one WebVTT cue')
  if (cues[0].start > 0.001) throw new Error('--span-cue needs a cue that starts at 0')
  const end = Math.max(cues[0].end, durationSec)
  const timing =
    /^((?:(?:\d+):)?\d{2}:\d{2}[.,]\d{1,3})(\s+-->\s+)(?:(?:\d+):)?\d{2}:\d{2}[.,]\d{1,3}(.*)$/
  const lines = vtt.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const index = lines.findIndex((line) => timing.test(line.trim()))
  if (index === -1) throw new Error('No cue timing line found')
  const match = timing.exec(lines[index].trim())
  if (!match) throw new Error('No cue timing line found')
  lines[index] = `${formatTimestamp(0)} --> ${formatTimestamp(end)}${match[3]}`
  return lines.join('\n')
}

/** Safari's HLS subtitle reader wants a timestamp map in the WebVTT header. */
export function ensureTimestampMap(vtt: string): string {
  const text = vtt.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!text.startsWith('WEBVTT')) throw new Error('Subtitle file must start with WEBVTT')
  if (/^X-TIMESTAMP-MAP=/m.test(text)) return text.endsWith('\n') ? text : `${text}\n`
  const lines = text.split('\n')
  lines.splice(1, 0, TIMESTAMP_MAP)
  const next = lines.join('\n')
  return next.endsWith('\n') ? next : `${next}\n`
}

/** Cue payload only, used to store searchable text on the catalog record. */
export function subtitleTextFromVtt(vtt: string): string {
  const text = vtt.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = text.split('\n')
  let index = 1
  while (index < lines.length && lines[index].trim() !== '') index += 1
  const timing = /^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{1,3})\s+-->\s+/
  const chunks: string[] = []
  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === '') index += 1
    if (index >= lines.length) break
    if (lines[index].startsWith('NOTE') || lines[index].startsWith('STYLE') || lines[index].startsWith('REGION')) {
      while (index < lines.length && lines[index].trim() !== '') index += 1
      continue
    }
    if (!timing.test(lines[index].trim()) && index + 1 < lines.length && timing.test(lines[index + 1].trim())) {
      index += 1
    }
    if (!timing.test(lines[index].trim())) {
      index += 1
      continue
    }
    index += 1
    const body: string[] = []
    while (index < lines.length && lines[index].trim() !== '') {
      body.push(lines[index])
      index += 1
    }
    const cue = body.join('\n').replace(/\s+$/, '')
    if (cue) chunks.push(cue)
  }
  return chunks.join('\n\n')
}
