const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/admin'

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match?.[1] ?? ''
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  const isFormData =
    typeof FormData !== 'undefined' &&
    init.body &&
    init.body instanceof FormData

  if (init.body && !headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes((init.method ?? 'GET').toUpperCase())) {
    headers.set('X-CSRFToken', getCsrfToken())
  }

  return fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })
}

