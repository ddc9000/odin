import { el } from '../dom'
import type { Video } from '../data/types'
import { formatDate, formatDuration } from '../format'
import { joinBase } from '../router'

function href(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path)
}

export function videoCard(video: Video): HTMLAnchorElement {
  const thumb = el('div', { class: 'thumb' })
  const image = document.createElement('img')
  image.src = video.thumbnailUrl
  image.alt = ''
  image.decoding = 'async'
  image.loading = 'lazy'
  thumb.append(image)
  if (video.placeholder) {
    thumb.append(el('span', { class: 'badge badge-placeholder' }, ['Placeholder']))
  }
  thumb.append(el('span', { class: 'badge badge-duration' }, [formatDuration(video.durationSec)]))

  const link = el('a', { class: 'card', href: href(`/watch/${encodeURIComponent(video.id)}`) }, [
    thumb,
    el('h2', { class: 'card-title' }, [video.title]),
    el('p', { class: 'card-meta' }, [`${video.channel.name} · ${formatDate(video.publishedAt)}`]),
  ])
  return link
}

export function suggestCard(video: Video): HTMLAnchorElement {
  const thumb = el('div', { class: 'suggest-thumb' })
  const image = document.createElement('img')
  image.src = video.thumbnailUrl
  image.alt = ''
  image.decoding = 'async'
  image.loading = 'lazy'
  thumb.append(image, el('span', { class: 'badge badge-duration' }, [formatDuration(video.durationSec)]))

  return el('a', { class: 'suggest', href: href(`/watch/${encodeURIComponent(video.id)}`) }, [
    thumb,
    el('span', { class: 'suggest-copy' }, [
      el('span', { class: 'suggest-title' }, [video.title]),
      el('span', { class: 'suggest-meta' }, [
        video.placeholder ? `${video.channel.name} · Placeholder` : video.channel.name,
      ]),
    ]),
  ])
}
