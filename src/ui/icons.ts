const SVG = 'http://www.w3.org/2000/svg'

function svg(className?: string): SVGSVGElement {
  const node = document.createElementNS(SVG, 'svg')
  node.setAttribute('viewBox', '0 0 24 24')
  node.setAttribute('aria-hidden', 'true')
  if (className) node.setAttribute('class', className)
  return node
}

function path(d: string, parent: SVGSVGElement): void {
  const node = document.createElementNS(SVG, 'path')
  node.setAttribute('d', d)
  node.setAttribute('fill', 'none')
  node.setAttribute('stroke', 'currentColor')
  node.setAttribute('stroke-width', '1.8')
  node.setAttribute('stroke-linecap', 'round')
  node.setAttribute('stroke-linejoin', 'round')
  parent.append(node)
}

export function menuIcon(): SVGSVGElement {
  const node = svg()
  path('M4 7h16M4 12h16M4 17h16', node)
  return node
}

export function searchIcon(): SVGSVGElement {
  const node = svg()
  path('M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z', node)
  path('M20 20l-3.5-3.5', node)
  return node
}

export function homeIcon(): SVGSVGElement {
  const node = svg()
  path('M4 11.5 12 4l8 7.5', node)
  path('M7 10.5V20h10v-9.5', node)
  return node
}

/** A stave, not a play button. */
export function markIcon(): SVGSVGElement {
  const node = svg('mark')
  path('M12 3.5v17', node)
  path('M12 9.5 18 6', node)
  path('M12 13.5 6 17', node)
  return node
}
