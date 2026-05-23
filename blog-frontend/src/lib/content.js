import { getCurrentLocale, t } from './i18n'

export function formatDate(value) {
  if (!value)
    return t('content.unpublished')

  return new Intl.DateTimeFormat(getCurrentLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function formatMonthDay(value) {
  if (!value)
    return t('content.datePending')

  return new Intl.DateTimeFormat(getCurrentLocale(), {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value) {
  if (!value)
    return t('content.timePending')

  return new Intl.DateTimeFormat(getCurrentLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatReadingTime(value) {
  if (!value)
    return t('content.readingTimePending')

  return t('content.readingTime', { minutes: value })
}

export function setPageTitle(title) {
  if (typeof document === 'undefined')
    return

  document.title = title ? `${title} | Handsome Nan` : 'Handsome Nan'
}

export function createHeadingId(title, seenIds = new Set()) {
  const base = `${title || ''}`
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}_\s-]/gu, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'

  let id = base
  let index = 2
  while (seenIds.has(id)) {
    id = `${base}-${index}`
    index += 1
  }

  seenIds.add(id)
  return id
}

function readTocNodes(toc) {
  if (typeof toc === 'string') {
    try {
      return JSON.parse(toc)
    }
    catch {
      return null
    }
  }

  return toc
}

function readTocDepth(node, fallbackDepth) {
  const explicitDepth = Number(node.depth)
  if (Number.isFinite(explicitDepth))
    return Math.max(0, explicitDepth)

  const level = Number(node.level)
  if (Number.isFinite(level))
    return Math.max(0, level - 2)

  return fallbackDepth
}

function readHeadingEntries(html) {
  if (!html || typeof document === 'undefined')
    return []

  const template = document.createElement('template')
  template.innerHTML = html

  const seenIds = new Set()

  return Array.from(template.content.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .map((heading) => {
      const title = heading.textContent?.trim()
      if (!title)
        return null

      if (!heading.id)
        heading.id = createHeadingId(title, seenIds)
      else
        seenIds.add(heading.id)

      const level = Number(heading.tagName.slice(1))
      return {
        title,
        href: `#${heading.id}`,
        depth: Number.isFinite(level) ? Math.max(0, level - 2) : 0,
      }
    })
    .filter(Boolean)
}

function hasVisibleTocItems(items) {
  return items.some(item => item.href)
}

export function normalizeToc(toc, html = '') {
  const output = []
  const normalizedToc = readTocNodes(toc)
  const headingEntries = readHeadingEntries(html)
  let headingIndex = 0

  function walk(nodes, depth = 0) {
    if (!Array.isArray(nodes))
      return

    nodes.forEach((node) => {
      if (!node || typeof node !== 'object')
        return

      const itemDepth = readTocDepth(node, depth)
      const title = node.title || node.text || node.name
      if (title) {
        const headingEntry = headingEntries[headingIndex]
        headingIndex += 1
        output.push({
          title,
          href: headingEntry?.href || node.href || (node.id ? `#${node.id}` : ''),
          depth: itemDepth,
        })
      }

      if (Array.isArray(node.children))
        walk(node.children, itemDepth + 1)
    })
  }

  if (Array.isArray(normalizedToc))
    walk(normalizedToc)
  else if (Array.isArray(normalizedToc?.items))
    walk(normalizedToc.items)
  else if (Array.isArray(normalizedToc?.children))
    walk(normalizedToc.children)

  return hasVisibleTocItems(output) ? output : headingEntries
}

export function normalizeTocFromHtml(html) {
  return readHeadingEntries(html)
}

export function assignHeadingIds(root) {
  if (!root)
    return []

  const seenIds = new Set()

  return Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .map((heading) => {
      const title = heading.textContent?.trim()
      if (!title)
        return null

      if (!heading.id)
        heading.id = createHeadingId(title, seenIds)
      else
        seenIds.add(heading.id)

      const level = Number(heading.tagName.slice(1))
      return {
        title,
        href: `#${heading.id}`,
        depth: Number.isFinite(level) ? Math.max(0, level - 2) : 0,
      }
    })
    .filter(Boolean)
}

export function pageFromQuery(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}
