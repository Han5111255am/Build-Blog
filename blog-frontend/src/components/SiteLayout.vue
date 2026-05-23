<template>
  <div class="relative min-h-screen overflow-hidden bg-[var(--c-bg)] text-[var(--c-text)]">
    <BackgroundGrid v-if="shouldRenderBackground" />
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-70"
      style="background: radial-gradient(circle at top, var(--c-top-glow), transparent 65%)"
    />

    <div class="relative z-10">
      <header
        class="site-header"
        :class="{ 'header-hidden': headerHidden }"
      >
        <RouterLink
          to="/"
          class="site-logo group no-underline"
          aria-label="Home"
        >
          <img
            class="site-logo-image"
            :src="theme === 'dark' ? '/site-logo-dark.svg' : '/site-logo.svg'"
            alt="Site logo"
          >
        </RouterLink>

        <nav class="site-nav" aria-label="Primary">
          <RouterLink :class="navClass('/posts')" to="/posts" title="Blog">{{ t('nav.blog') }}</RouterLink>
          <RouterLink :class="navClass('/notes')" to="/notes" title="Notes">{{ t('nav.notes') }}</RouterLink>
          <RouterLink :class="navClass('/projects')" to="/projects" title="Projects">{{ t('nav.projects') }}</RouterLink>
          <RouterLink :class="iconClass('/podcasts')" to="/podcasts" aria-label="Podcasts" :title="t('nav.podcasts')">
            <AppIcon name="podcast" />
          </RouterLink>
          <RouterLink :class="iconClass('/photos')" to="/photos" aria-label="Photos" :title="t('nav.photos')">
            <AppIcon name="photo" />
          </RouterLink>
          <button
            class="site-nav-lang"
            type="button"
            :aria-label="t('nav.toggleLanguage', { language: nextLanguageInfo.label })"
            :title="t('nav.toggleLanguage', { language: nextLanguageInfo.label })"
            @click="handleLanguageToggle"
          >
            {{ currentLanguageInfo.shortLabel }}
          </button>
          <a
            class="site-nav-icon"
            href="https://github.com/example"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <AppIcon name="github" />
          </a>
          <button
            class="site-nav-icon"
            type="button"
            :aria-label="theme === 'dark' ? t('nav.toggleLightMode') : t('nav.toggleDarkMode')"
            :title="t('nav.toggleTheme')"
            @click="toggleTheme"
          >
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
          </button>
        </nav>
      </header>

      <main class="site-main">
        <slot />
        <div
          v-if="!isHomePage"
          class="m-auto mt-8 mb-8 flex w-fit max-w-full items-center gap-2 text-sm text-[var(--c-muted)] slide-enter animate-delay-500 print:hidden"
        >
          <span class="font-mono text-[var(--c-soft)]" aria-hidden="true">&gt;</span>
          <RouterLink
            :to="parentPath"
            class="min-h-[1.5rem] font-mono text-[var(--c-muted)] underline decoration-[var(--c-link-underline)] underline-offset-3 transition-[color,text-decoration-color] duration-200 hover:text-[var(--c-text)] hover:decoration-[var(--c-text)] focus-visible:rounded-sm focus-visible:text-[var(--c-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-link-underline)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--c-bg)]"
            :aria-label="t('site.backParent')"
          >
            cd ..
          </RouterLink>
        </div>
      </main>

      <footer class="site-footer">
        <p class="text-sm text-[var(--c-soft)]">
          Copyright 2026 Personal Blog
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import BackgroundGrid from './BackgroundGrid.vue'
import { currentLanguage, getLanguageInfo, getNextLanguage, t, toggleLanguage as switchLanguage } from '../lib/i18n'

const route = useRoute()
const shouldRenderBackground = ref(false)
const headerHidden = ref(false)
let lastScrollY = 0
const SCROLL_THRESHOLD = 10

function onScroll() {
  const currentY = window.scrollY
  if (currentY < 80) {
    headerHidden.value = false
  }
  else if (currentY - lastScrollY > SCROLL_THRESHOLD) {
    headerHidden.value = true
  }
  else if (lastScrollY - currentY > SCROLL_THRESHOLD) {
    headerHidden.value = false
  }
  lastScrollY = currentY
}
const isHomePage = computed(() => route.path === '/')
const currentLanguageInfo = computed(() => getLanguageInfo(currentLanguage.value))
const nextLanguageInfo = computed(() => getLanguageInfo(getNextLanguage()))
const parentPath = computed(() => {
  if (route.path === '/')
    return '/'

  if (route.name === 'not-found')
    return '/'

  const segments = route.path.split('/').filter(Boolean)
  segments.pop()

  return segments.length ? `/${segments.join('/')}` : '/'
})
const theme = ref('dark')
const followsSystemTheme = ref(true)
const FAVICON_VERSION = '20260314d'
let systemThemeMediaQuery
let removeSystemThemeListener
let clearDeferredBackgroundMount

function updateFavicon(nextTheme) {
  const favicon = document.querySelector('#app-favicon')
  if (favicon)
    favicon.setAttribute('href', `${nextTheme === 'dark' ? '/favicon-dark.svg' : '/favicon-light.svg'}?v=${FAVICON_VERSION}`)
}

function setDocumentTheme(nextTheme) {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  document.documentElement.classList.toggle('dark', nextTheme === 'dark')
}

function getSystemTheme() {
  return systemThemeMediaQuery?.matches ? 'dark' : 'light'
}

function applyTheme(nextTheme) {
  setDocumentTheme(nextTheme)
}

function syncWithSystemTheme() {
  const systemTheme = getSystemTheme()
  updateFavicon(systemTheme)

  if (followsSystemTheme.value)
    setDocumentTheme(systemTheme)
}

function toggleTheme() {
  followsSystemTheme.value = false
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

function handleLanguageToggle() {
  switchLanguage()
}

function navClass(prefix) {
  return [
    'site-nav-link',
    route.path === prefix || route.path.startsWith(`${prefix}/`) ? 'site-nav-link-active' : '',
  ]
}

function iconClass(prefix) {
  return [
    'site-nav-icon',
    route.path === prefix || route.path.startsWith(`${prefix}/`) ? 'site-nav-link-active' : '',
  ]
}

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })

  systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  syncWithSystemTheme()

  const handleSystemThemeChange = () => {
    syncWithSystemTheme()
  }

  systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange)
  removeSystemThemeListener = () => systemThemeMediaQuery?.removeEventListener('change', handleSystemThemeChange)

  const mountBackground = () => {
    shouldRenderBackground.value = true
  }

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(mountBackground, { timeout: 1200 })
    clearDeferredBackgroundMount = () => window.cancelIdleCallback?.(idleId)
  }
  else {
    const timeoutId = window.setTimeout(mountBackground, 180)
    clearDeferredBackgroundMount = () => window.clearTimeout(timeoutId)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  removeSystemThemeListener?.()
  clearDeferredBackgroundMount?.()
})
</script>
