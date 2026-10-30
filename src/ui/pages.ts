import type { Catalog } from '../data/repository'
import type { Video } from '../data/types'
import { el } from '../dom'
import { formatDate, initials } from '../format'
import { mountPlayer, type PlayerController } from '../player/mount'
import { joinBase } from '../router'
import { readStorage, writeStorage } from '../storage'
import { suggestCard, videoCard } from './card'

const CAPTIONS_KEY = 'odin.captions'

function href(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path)
}

export function renderHome(main: HTMLElement, catalog: Catalog): void {
  const videos = catalog.list()
  const grid = el('div', { class: 'grid' })
  for (const video of videos) grid.append(videoCard(video))
  const page = el('section', { class: 'page' }, [
    el('h1', { class: 'lede' }, ['Forest videos, with a stanza from the Hávamál.']),
    el('p', { class: 'deck' }, [
      'Read-only for now. A placeholder is a generated picture and tone, run through the real pipeline, with a public-domain verse held on screen for the whole clip.',
    ]),
  ])
  if (videos.length === 0) {
    page.append(el('p', { class: 'empty' }, ['The catalog is empty.']))
  } else {
    page.append(grid)
  }
  main.append(page)
}

export function renderSearch(main: HTMLElement, catalog: Catalog, query: string): void {
  const results = catalog.search(query)
  const heading = query.trim() ? `Results for “${query.trim()}”` : 'Search'
  const count =
    results.length === 1 ? '1 video' : `${results.length} videos`
  const page = el('section', { class: 'page' }, [
    el('h1', { class: 'page-title' }, [heading]),
    el('p', { class: 'deck' }, [query.trim() ? count : 'Type in the search field. An empty search lists the catalog.']),
  ])
  if (query.trim() && results.length === 0) {
    page.append(el('p', { class: 'empty' }, [`Nothing in the catalog matches “${query.trim()}”.`]))
  } else {
    const grid = el('div', { class: 'grid' })
    for (const video of results) grid.append(videoCard(video))
    page.append(grid)
  }
  main.append(page)
}

function verseBlock(video: Video): HTMLElement {
  const block = el('figure', { class: 'verse-block' })
  if (video.stanza != null) {
    block.append(el('p', { class: 'stanza-label' }, [`Hávamál ${video.stanza}`]))
  }
  block.append(el('blockquote', { class: 'verse' }, [video.subtitleText]))
  if (video.subtitleCitation) {
    const cite = el('figcaption', { class: 'citation' }, [video.subtitleCitation])
    block.append(cite)
  }
  return block
}

export function renderWatch(main: HTMLElement, catalog: Catalog, id: string): PlayerController | null {
  const video = catalog.getById(id)
  if (!video) {
    renderNotFound(main, 'This video is not in the catalog.')
    return null
  }

  const stage = el('div', { class: 'stage' })
  const captionsOn = readStorage(CAPTIONS_KEY) !== 'off'
  const player = mountPlayer(stage, video, captionsOn)

  const cc = el('button', {
    class: 'cc',
    type: 'button',
    'aria-pressed': captionsOn ? 'true' : 'false',
  }, ['Subtitles'])
  cc.addEventListener('click', () => {
    const next = cc.getAttribute('aria-pressed') !== 'true'
    cc.setAttribute('aria-pressed', next ? 'true' : 'false')
    writeStorage(CAPTIONS_KEY, next ? 'on' : 'off')
    player.setCaptions(next)
  })

  const avatar = el('span', { class: 'avatar', 'aria-hidden': 'true' }, [initials(video.channel.name)])
  const channel = el('div', { class: 'channel' }, [
    el('p', { class: 'channel-name' }, [video.channel.name]),
    el('p', { class: 'channel-meta' }, [
      `${video.channel.handle} · ${formatDate(video.publishedAt)}`,
    ]),
  ])

  const primary = el('div', { class: 'watch-primary' }, [stage])
  if (video.placeholder) primary.append(el('p', { class: 'placeholder-note' }, ['Placeholder']))
  primary.append(
    el('h1', { class: 'watch-title' }, [video.title]),
    el('div', { class: 'watch-row' }, [el('div', { class: 'channel-row' }, [avatar, channel]), cc]),
    el('div', { class: 'description' }, [el('p', {}, [video.description]), verseBlock(video)]),
  )

  const related = catalog.related(video.id)
  const list = el('div', { class: 'suggest-list' })
  for (const item of related) list.append(suggestCard(item))
  const aside = el('aside', { class: 'up-next', 'aria-label': 'Suggested videos' }, [
    el('h2', { class: 'up-next-title' }, ['Up next']),
    related.length === 0 ? el('p', { class: 'empty' }, ['No other videos yet.']) : list,
  ])

  main.append(el('div', { class: 'watch' }, [primary, aside]))
  return player
}

export function renderNotFound(main: HTMLElement, message = 'That page is not part of ODIN.'): void {
  main.append(
    el('section', { class: 'page' }, [
      el('h1', { class: 'page-title' }, ['Not found']),
      el('p', { class: 'deck' }, [message]),
      el('a', { class: 'text-link', href: href('/') }, ['Back home']),
    ]),
  )
}
