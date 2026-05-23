import 'virtual:uno.css'
import 'katex/dist/katex.min.css'
import './styles.css'

import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { initLanguage } from './lib/i18n'
import { routes } from './router'
import { buildStaticRouteState, includedRoutes } from './lib/ssg'

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior(to) {
      if (to.hash)
        return { el: to.hash, top: 88, behavior: 'smooth' }

      return { top: 0, behavior: 'smooth' }
    },
  },
  async ({ isClient, initialState, onSSRAppRendered }) => {
    if (isClient)
      initLanguage()

    if (!isClient) {
      const state = await buildStaticRouteState()
      onSSRAppRendered(() => {
        initialState.collections = state.collections
        initialState.details = state.details
      })
    }
  },
)

export { includedRoutes }
