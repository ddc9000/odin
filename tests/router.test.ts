import { describe, expect, it } from 'vitest'
import { joinBase, parseRoute } from '../src/router'

const base = '/odin/'

describe('router', () => {
  it('joins paths onto the GitHub Pages base', () => {
    expect(joinBase(base, '/')).toBe('/odin/')
    expect(joinBase(base, '/watch/at-the-gate')).toBe('/odin/watch/at-the-gate')
    expect(joinBase(base, '/search?q=gate')).toBe('/odin/search?q=gate')
  })

  it('reads home, watch and search under the base path', () => {
    expect(parseRoute('/odin/', '', base)).toEqual({ name: 'home' })
    expect(parseRoute('/odin', '', base)).toEqual({ name: 'home' })
    expect(parseRoute('/odin/index.html', '', base)).toEqual({ name: 'home' })
    expect(parseRoute('/odin/watch/at-the-gate', '', base)).toEqual({ name: 'watch', id: 'at-the-gate' })
    expect(parseRoute('/odin/search', '?q=pine+road', base)).toEqual({ name: 'search', query: 'pine road' })
    expect(parseRoute('/odin/missing', '', base)).toEqual({ name: 'notfound' })
  })
})
