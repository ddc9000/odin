import { cuesAt, parseVtt, type Cue } from './vtt'
import { prefersNativeHls } from './engine'
import type { Video } from '../data/types'

export interface PlayerController {
  destroy(): void
  setCaptions(on: boolean): void
}

interface HlsLike {
  loadSource(url: string): void
  attachMedia(media: HTMLMediaElement): void
  destroy(): void
  on(event: string, callback: (event: string, data: { fatal?: boolean }) => void): void
}

interface HlsCtor {
  isSupported(): boolean
  Events: { ERROR: string }
  new (config?: Record<string, unknown>): HlsLike
}

function captionLines(cues: Cue[], time: number): string[] {
  return cuesAt(cues, time)
    .map((cue) => cue.text)
    .join('\n\n')
    .split('\n')
    .filter((line) => line.length > 0)
}

export function mountPlayer(stage: HTMLElement, video: Video, captionsOn: boolean): PlayerController {
  const media = document.createElement('video')
  media.className = 'video'
  media.controls = true
  media.playsInline = true
  media.setAttribute('playsinline', '')
  media.setAttribute('webkit-playsinline', '')
  media.preload = 'metadata'
  media.crossOrigin = 'anonymous'
  media.poster = video.thumbnailUrl
  media.setAttribute('aria-label', video.title)

  const captions = document.createElement('div')
  captions.className = 'captions'
  captions.setAttribute('aria-live', 'polite')

  const error = document.createElement('p')
  error.className = 'player-error'
  error.hidden = true
  error.textContent = 'This video could not be played.'

  stage.replaceChildren(media, captions, error)

  let cues: Cue[] = []
  let enabled = captionsOn
  let shown = ''
  let cancelled = false
  let hls: HlsLike | null = null
  let captionsReady = false
  let problem: string | null = null

  const paint = () => {
    captions.classList.toggle('is-off', !enabled)
    captions.toggleAttribute('aria-hidden', !enabled)
    if (problem) return
    const lines = enabled && captionsReady ? captionLines(cues, media.currentTime || 0) : []
    const next = lines.join('\n')
    if (next === shown) return
    shown = next
    captions.replaceChildren(
      ...lines.map((line) => {
        const span = document.createElement('span')
        span.textContent = line
        return span
      }),
    )
  }

  const fail = () => {
    if (cancelled) return
    error.hidden = false
  }

  media.addEventListener('timeupdate', paint)
  media.addEventListener('seeked', paint)
  media.addEventListener('loadedmetadata', paint)
  media.addEventListener('error', fail)

  void (async () => {
    try {
      const response = await fetch(video.subtitlesUrl)
      if (!response.ok) throw new Error(`Subtitles HTTP ${response.status}`)
      cues = parseVtt(await response.text())
      captionsReady = true
      if (!cancelled) paint()
    } catch {
      if (cancelled) return
      problem = 'Subtitles could not be loaded.'
      const span = document.createElement('span')
      span.textContent = problem
      captions.replaceChildren(span)
      shown = problem
    }
  })()

  void (async () => {
    try {
      if (prefersNativeHls((mime) => media.canPlayType(mime))) {
        if (cancelled) return
        media.src = video.hlsUrl
        return
      }
      const imported = (await import('hls.js')) as { default: HlsCtor }
      if (cancelled) return
      const Hls = imported.default
      if (!Hls.isSupported()) {
        media.src = video.hlsUrl
        return
      }
      const player = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        startLevel: -1,
      })
      hls = player
      player.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) fail()
      })
      player.loadSource(video.hlsUrl)
      player.attachMedia(media)
    } catch {
      fail()
    }
  })()

  return {
    setCaptions(on) {
      enabled = on
      shown = ''
      paint()
    },
    destroy() {
      cancelled = true
      hls?.destroy()
      hls = null
      media.pause()
      media.removeAttribute('src')
      media.load()
    },
  }
}
