import './styles/tokens.css'
import './styles/app.css'
import { catalog } from './data'
import { clear } from './dom'
import { mountShell } from './ui/shell'
import { renderHome, renderNotFound, renderSearch, renderWatch } from './ui/pages'
import { currentRoute, startRouter, type Route } from './router'
import type { PlayerController } from './player/mount'

const root = document.querySelector('#app')
if (!(root instanceof HTMLElement)) throw new Error('Missing #app')

const shell = mountShell(root)
let player: PlayerController | null = null

function titleFor(route: Route): string {
  if (route.name === 'home') return 'ODIN'
  if (route.name === 'search') {
    return route.query.trim() ? `Search “${route.query.trim()}” · ODIN` : 'Search · ODIN'
  }
  if (route.name === 'watch') {
    const video = catalog.getById(route.id)
    return video ? `${video.title} · ODIN` : 'Not found · ODIN'
  }
  return 'Not found · ODIN'
}

function render(): void {
  player?.destroy()
  player = null
  const route = currentRoute()
  document.title = titleFor(route)
  clear(shell.main)
  shell.sync(route)
  if (route.name === 'home') renderHome(shell.main, catalog)
  else if (route.name === 'search') renderSearch(shell.main, catalog, route.query)
  else if (route.name === 'watch') player = renderWatch(shell.main, catalog, route.id)
  else renderNotFound(shell.main)
  window.scrollTo(0, 0)
}

startRouter(render)
render()
