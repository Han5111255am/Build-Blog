import { fetchCollection, fetchDetail } from './api'

let staticRouteStatePromise

function buildDetailPath(basePath, slug) {
  return `${basePath}/${encodeURIComponent(slug)}`
}

async function collectPagedResults(kind) {
  const results = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const payload = await fetchCollection(kind, page)
    results.push(...(payload.results || []))
    hasNext = Boolean(payload.next)
    page += 1
  }

  return results
}

export async function collectStaticRoutePayload() {
  const [posts, notes, projects, podcasts] = await Promise.all([
    collectPagedResults('posts'),
    collectPagedResults('notes'),
    collectPagedResults('projects'),
    collectPagedResults('podcasts'),
  ])

  return {
    collections: {
      posts,
      notes,
      projects,
      podcasts,
    },
    details: {},
  }
}

export async function fillStaticRouteDetails(state) {
  const detailTasks = []

  for (const item of state.collections.posts) {
    detailTasks.push(
      fetchDetail('posts', item.slug).then(detail => [buildDetailPath('/posts', item.slug), detail]),
    )
  }

  for (const item of state.collections.notes) {
    detailTasks.push(
      fetchDetail('notes', item.slug).then(detail => [buildDetailPath('/notes', item.slug), detail]),
    )
  }

  for (const item of state.collections.projects) {
    detailTasks.push(
      fetchDetail('projects', item.slug).then(detail => [buildDetailPath('/projects', item.slug), detail]),
    )
  }

  for (const item of state.collections.podcasts) {
    detailTasks.push(
      fetchDetail('podcasts', item.slug).then(detail => [buildDetailPath('/podcasts', item.slug), detail]),
    )
  }

  const details = await Promise.all(detailTasks)
  state.details = Object.fromEntries(details)
  return state
}

export async function buildStaticRouteState() {
  if (!staticRouteStatePromise) {
    staticRouteStatePromise = collectStaticRoutePayload()
      .then(fillStaticRouteDetails)
  }

  return staticRouteStatePromise
}

export function extractDetailState(initialState, routePath) {
  return initialState?.details?.[routePath] || null
}

export function extractCollectionState(initialState, kind) {
  return initialState?.collections?.[kind] || null
}

export async function includedRoutes(paths) {
  const state = await buildStaticRouteState()
  const staticPaths = paths.filter(path => !path.includes(':'))
  const detailPaths = [
    ...state.collections.posts.map(item => buildDetailPath('/posts', item.slug)),
    ...state.collections.notes.map(item => buildDetailPath('/notes', item.slug)),
    ...state.collections.projects.map(item => buildDetailPath('/projects', item.slug)),
    ...state.collections.podcasts.map(item => buildDetailPath('/podcasts', item.slug)),
  ]

  return Array.from(new Set([...staticPaths, ...detailPaths]))
}
