const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const SSR_REQUEST_ORIGIN = import.meta.env.VITE_SSG_REQUEST_ORIGIN || 'http://127.0.0.1:8000'

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function createEndpoint(path, params = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const isClient = typeof window !== 'undefined'
  const url = new URL(
    `${API_BASE_URL}${normalizedPath}`,
    isClient ? window.location.origin : SSR_REQUEST_ORIGIN,
  )

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      url.searchParams.set(key, `${value}`)
  })

  return isClient ? `${url.pathname}${url.search}` : url.toString()
}

export async function requestJSON(path, params = {}) {
  const response = await fetch(createEndpoint(path, params), {
    headers: {
      Accept: 'application/json',
    },
  })

  const isJSON = response.headers.get('content-type')?.includes('application/json')
  const payload = isJSON ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(
      payload?.detail || '请求失败，请稍后重试。',
      response.status,
      payload,
    )
  }

  return payload
}

export async function sendJSON(path, payload = {}) {
  const response = await fetch(createEndpoint(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const isJSON = response.headers.get('content-type')?.includes('application/json')
  const data = isJSON ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(
      data?.detail || data?.message || '请求失败，请稍后重试。',
      response.status,
      data,
    )
  }

  return data
}

export function fetchCollection(kind, page = 1, extraParams = {}) {
  return requestJSON(`/${kind}/`, {
    page,
    ...extraParams,
  })
}

export function fetchHomeAggregate() {
  return requestJSON('/posts/home/')
}

export function fetchFriendLinks(page = 1) {
  return fetchCollection('friend-links', page, {
    ordering: 'display_order',
  })
}

export async function fetchAllFriendLinks() {
  const results = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const payload = await fetchFriendLinks(page)
    results.push(...(payload.results || []))
    hasNext = Boolean(payload.next)
    page += 1
  }

  return results
}

export function applyFriendLink(payload) {
  return sendJSON('/friend-links/apply/', payload)
}

export function fetchDetail(kind, slug, extraParams = {}) {
  return requestJSON(`/${kind}/${encodeURIComponent(slug)}/`, {
    ...extraParams,
  })
}

export function resolveAssetUrl(value) {
  if (!value)
    return ''

  if (/^https?:\/\//.test(value))
    return value

  return value.startsWith('/') ? value : `/${value}`
}
