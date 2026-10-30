import { el } from '../dom'
import { readStorage, writeStorage } from '../storage'
import type { Route } from '../router'
import { joinBase } from '../router'
import { homeIcon, markIcon, menuIcon, searchIcon } from './icons'

const SIDEBAR_KEY = 'odin.sidebar'

export interface Shell {
  main: HTMLElement
  sync(route: Route): void
}

function href(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path)
}

export function mountShell(root: HTMLElement): Shell {
  const home = href('/')
  const menu = el('button', {
    class: 'icon-btn',
    type: 'button',
    'aria-label': 'Menu',
    'aria-expanded': 'false',
    'aria-controls': 'sidebar',
  })
  menu.append(menuIcon())

  const brand = el('a', { class: 'brand', href: home }, [markIcon(), el('span', {}, ['ODIN'])])

  const searchInput = el('input', {
    id: 'q',
    type: 'search',
    name: 'q',
    placeholder: 'Search videos',
    autocomplete: 'off',
    enterkeyhint: 'search',
  })
  const searchButton = el('button', { type: 'submit', 'aria-label': 'Search' })
  searchButton.append(searchIcon())
  const form = el('form', { class: 'search', role: 'search' }, [
    el('label', { class: 'sr-only', for: 'q' }, ['Search videos']),
    searchInput,
    searchButton,
  ])

  const topbar = el('header', { class: 'topbar' }, [menu, brand, form])

  const homeLink = el('a', { class: 'nav-link', href: home }, [homeIcon(), el('span', { class: 'nav-label' }, ['Home'])])
  const note = el('p', { class: 'sidebar-note' }, ['Read-only. No accounts in this version.'])
  const sidebar = el('aside', { class: 'sidebar', id: 'sidebar' }, [
    el('nav', { 'aria-label': 'Sections' }, [homeLink]),
    note,
  ])

  const backdrop = el('button', { class: 'backdrop', type: 'button', 'aria-label': 'Close menu' })
  backdrop.hidden = true

  const main = el('main', { id: 'main', class: 'main' })
  const frame = el('div', { class: 'frame' }, [sidebar, main])
  const skip = el('a', { class: 'skip', href: '#main' }, ['Skip to content'])

  root.replaceChildren(skip, topbar, frame, backdrop)

  const mobileQuery = window.matchMedia('(max-width: 899px)')
  let mobileOpen = false
  let desktopCollapsed = readStorage(SIDEBAR_KEY) === 'collapsed'

  const syncTopbar = () => {
    document.documentElement.style.setProperty('--topbar-h', `${topbar.getBoundingClientRect().height}px`)
  }
  syncTopbar()
  window.addEventListener('resize', syncTopbar)
  if ('ResizeObserver' in window) new ResizeObserver(syncTopbar).observe(topbar)

  const apply = () => {
    const mobile = mobileQuery.matches
    sidebar.classList.toggle('is-open', mobile && mobileOpen)
    document.body.classList.toggle('sidebar-collapsed', !mobile && desktopCollapsed)
    document.body.classList.toggle('nav-open', mobile && mobileOpen)
    backdrop.hidden = !(mobile && mobileOpen)
    menu.setAttribute('aria-expanded', mobile ? String(mobileOpen) : String(!desktopCollapsed))
    menu.setAttribute('aria-label', mobile ? (mobileOpen ? 'Close menu' : 'Menu') : desktopCollapsed ? 'Expand menu' : 'Collapse menu')
  }

  const closeMobile = () => {
    mobileOpen = false
    apply()
  }

  menu.addEventListener('click', () => {
    if (mobileQuery.matches) mobileOpen = !mobileOpen
    else {
      desktopCollapsed = !desktopCollapsed
      writeStorage(SIDEBAR_KEY, desktopCollapsed ? 'collapsed' : 'expanded')
    }
    apply()
  })
  backdrop.addEventListener('click', closeMobile)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobile()
  })
  mobileQuery.addEventListener('change', () => {
    mobileOpen = false
    apply()
  })
  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('a') && mobileQuery.matches) closeMobile()
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const query = searchInput.value.trim()
    const path = query ? `/search?q=${encodeURIComponent(query)}` : '/search'
    const url = href(path)
    if (url !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', url)
    }
    window.dispatchEvent(new PopStateEvent('popstate'))
  })

  apply()

  return {
    main,
    sync(route) {
      const onHome = route.name === 'home'
      if (onHome) homeLink.setAttribute('aria-current', 'page')
      else homeLink.removeAttribute('aria-current')
      if (route.name === 'search') searchInput.value = route.query
      else if (document.activeElement !== searchInput) searchInput.value = ''
    },
  }
}
