export type Route =
  | { name: 'home' }
  | { name: 'watch'; id: string }
  | { name: 'search'; query: string }
  | { name: 'notfound' }

export function joinBase(base: string, path: string): string {
  const root = base.endsWith('/') ? base : `${base}/`
  const rest = path.startsWith('/') ? path.slice(1) : path
  return root + rest
}

function stripBase(pathname: string, base: string): string {
  const withSlash = base.endsWith('/') ? base : `${base}/`
  const noSlash = withSlash.slice(0, -1)
  if (pathname === noSlash) return '/'
  if (withSlash !== '/' && pathname.startsWith(withSlash)) {
    const rest = pathname.slice(withSlash.length)
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function parseRoute(pathname: string, search: string, base: string): Route {
  let path = stripBase(pathname, base)
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  if (path === '/' || path === '/index.html') return { name: 'home' }

  const watch = /^\/watch\/([^/]+)$/.exec(path)
  if (watch) {
    try {
      return { name: 'watch', id: decodeURIComponent(watch[1]) }
    } catch {
      return { name: 'notfound' }
    }
  }

  if (path === '/search') {
    const query = new URLSearchParams(search).get('q') ?? ''
    return { name: 'search', query }
  }

  return { name: 'notfound' }
}

export function currentRoute(): Route {
  return parseRoute(window.location.pathname, window.location.search, import.meta.env.BASE_URL)
}

export function startRouter(onChange: () => void): void {
  window.addEventListener('popstate', onChange)
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest('a')
    if (!anchor) return
    if (anchor.target && anchor.target !== '_self') return
    if (anchor.hasAttribute('download')) return
    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('#')) return
    let url: URL
    try {
      url = new URL(anchor.href)
    } catch {
      return
    }
    if (url.origin !== window.location.origin) return
    event.preventDefault()
    const next = url.pathname + url.search + url.hash
    const current = window.location.pathname + window.location.search + window.location.hash
    if (next !== current) window.history.pushState(null, '', next)
    onChange()
  })
}

export function go(path: string): void {
  const url = joinBase(import.meta.env.BASE_URL, path)
  window.history.pushState(null, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
