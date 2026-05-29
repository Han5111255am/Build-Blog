<template>
  <section ref="homeContentRef" class="content-shell home-content-shell">
    <section class="home-hero" aria-labelledby="home-hero-title">
      <div class="home-hero-copy">
        <h1 id="home-hero-title" class="home-hero-title">
          <span>
            <span>{{ t('home.heroGreeting') }}</span>
            <em class="home-hero-gradient-text">Blog Owner</em>
          </span>
          <span>
            <span>{{ t('home.heroRolePrefix') }}</span>
            <em class="home-hero-gradient-text">{{ t('home.heroCv') }}</em>
            <span>{{ t('home.heroRole') }}</span>
          </span>
          <span>{{ t('home.heroWelcome') }}</span>
        </h1>
      </div>

      <div class="home-hero-visual">
        <div class="home-tech-orbit home-tech-orbit-outer" aria-hidden="true">
          <div
            v-for="(stack, index) in outerOrbitStacks"
            :key="stack.name"
            class="home-tech-node"
            :style="orbitItemStyle(index, outerOrbitStacks.length)"
          >
            <span class="home-tech-node-upright">
              <span class="home-tech-node-float">
                <img :src="stack.icon" :class="stack.iconClass" alt="">
              </span>
            </span>
          </div>
        </div>

        <div class="home-tech-orbit home-tech-orbit-inner" aria-hidden="true">
          <div
            v-for="(stack, index) in innerOrbitStacks"
            :key="stack.name"
            class="home-tech-node"
            :style="orbitItemStyle(index, innerOrbitStacks.length)"
          >
            <span class="home-tech-node-upright">
              <span class="home-tech-node-float">
                <img :src="stack.icon" :class="stack.iconClass" alt="">
              </span>
            </span>
          </div>
        </div>

        <div class="home-hero-avatar-shell">
          <div class="home-hero-avatar-glow" />
          <img
            class="home-hero-avatar-image"
            src="/site-avatar.svg"
            :alt="t('home.avatarAlt')"
          >
        </div>
      </div>
    </section>

    <article class="home-copy mt-10">
      <p>
        {{ t('home.introBeforeName') }} <strong>Blog Owner</strong>{{ t('home.introBeforeSchool') }}<a
          href="https://example.com"
          class="text-link"
          target="_blank"
          rel="noopener noreferrer"
        ><strong>{{ t('home.profileLinkLabel') }}</strong></a>{{ t('home.introAfterSchool') }}
      </p>
      <p>
        {{ t('home.intro2') }}
      </p>
      <p>
        {{ t('home.intro3') }}
      </p>
      <p>
        {{ t('home.channelsLabel') }}
        <span
          v-for="item in featuredLinks"
          :key="item.label"
          class="inline-tag"
        >
          {{ item.label }}
        </span>
      </p>
      <p>
        {{ t('home.routePrefix') }}
        <RouterLink class="text-link" to="/posts">Blog</RouterLink>、
        <RouterLink class="text-link" to="/notes">Notes</RouterLink>、
        <RouterLink class="text-link" to="/projects">Projects</RouterLink>、
        <RouterLink class="text-link" to="/podcasts">Podcasts</RouterLink>
        {{ t('home.routeAnd') }}
        <RouterLink class="text-link" to="/photos">Photos</RouterLink>
        {{ t('home.routeSuffix') }}
      </p>
      <p>
        {{ t('home.dream') }}
      </p>
      <hr style="max-width: 50px; margin: 2rem auto; border: 0; border-top: 1px solid var(--c-border);">
      <p>
        <strong class="home-skills-title">{{ t('home.skillsTitle') }}</strong>
        <br>
        <span v-for="item in techStack" :key="item.name" class="inline-tag">
          <img :src="item.icon" :alt="item.name" class="tech-stack-icon">
          {{ item.name }}
        </span>
      </p>
      <hr style="max-width: 50px; margin: 2rem auto; border: 0; border-top: 1px solid var(--c-border);">
      <p data-imt-p="1" data-imt-translation-only="1">
        {{ t('home.findMe') }}
      </p>
      <p flex="~ gap-4 wrap" class="mt--2!">
        <a href="https://github.com/example" target="_blank" class="link-short-underline" >
          <img src="/my_icons/github.svg" alt="" class="social-icon social-icon-mono">
          GitHub
        </a>
        <a href="https://example.com" >
          <img src="/my_icons/tiktok.svg" alt="" class="social-icon social-icon-mono">
          {{ t('home.douyin') }}
        </a>
        <a href="https://example.com" target="_blank" >
          <img src="/my_icons/linuxdo.svg" alt="" class="social-icon">
          Linux.do
        </a>
        <a href="https://example.com" target="_blank" >
          <img src="/my_icons/youtube.svg" alt="" class="social-icon social-icon-mono">
          YouTube
        </a>
        <a href="https://example.com" target="_blank">
          <img src="/my_icons/bilibili.svg" alt="" class="social-icon social-icon-mono">
          {{ t('home.bilibili') }}
        </a>
        <a href="https://example.com" target="_blank">
          <img src="/my_icons/twitter.svg" alt="" class="social-icon social-icon-mono">
          X
        </a>
      </p>
      <p>
        {{ t('home.emailLabel') }}
        <span>hello@example.com</span>
        {{ t('home.or') }}
        <span>contact@example.com</span>
      </p>
      
      <p>
        {{ t('home.businessWechat') }}
        <img src="/my_icons/wechat.svg" alt="" class="social-icon social-icon-mono">
        your-wechat-id
      </p>
      <p>
        {{ t('home.aiGateway') }}
        <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>
      </p>
    </article>

    <hr style="max-width: 50px; margin: 2rem auto; border: 0; border-top: 1px solid var(--c-border);">
    <section class="home-analytics-shell" :aria-label="t('home.analyticsAria')">
      <div class="home-analytics-grid">
        <article
          v-for="card in analyticsCards"
          :key="card.key"
          class="home-analytics-card"
        >
          <div class="home-analytics-card-head">
            <p class="home-analytics-card-title">{{ card.label }}</p>
            <p class="home-analytics-card-caption">{{ card.caption }}</p>
          </div>
          <p class="home-analytics-card-value">{{ card.value }}</p>
          <div
            class="home-analytics-card-change"
            :class="{ 'is-placeholder': card.placeholder }"
          >
            <span class="home-analytics-card-change-icon" aria-hidden="true">{{ card.changeIcon }}</span>
            <span>{{ card.changeText }}</span>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { animate } from 'motion-v'
import { computed, onMounted, ref, watch } from 'vue'
import { fetchHomeAggregate } from '../lib/api'
import { setPageTitle } from '../lib/content'
import { currentLanguage, getCurrentLocale, t } from '../lib/i18n'

const HOME_ENTRY_TEXT_TARGET_SELECTOR = [
  '.home-hero-title > span',
  '.home-copy > *',
  '.home-content-shell > hr',
  '.home-analytics-shell',
].join(', ')

const HOME_ENTRY_VISUAL_TARGET_SELECTOR = '.home-hero-visual'

const ANALYTICS_CARD_DEFINITIONS = [
  { key: 'visitors', labelKey: 'home.analytics.visitors' },
  { key: 'visits', labelKey: 'home.analytics.visits' },
  { key: 'pageviews', labelKey: 'home.analytics.pageviews' },
]

const outerOrbitStacks = [
  { name: 'qwen', icon: '/tech_stack_icons/qwen.svg' },
  { name: 'chatgpt', icon: '/tech_stack_icons/openai.svg', iconClass: 'home-tech-icon-mono' },
  { name: 'grok', icon: '/tech_stack_icons/grok.svg', iconClass: 'home-tech-icon-mono' },
  { name: 'gemini', icon: '/tech_stack_icons/gemini.svg' },
  { name: 'cursor', icon: '/tech_stack_icons/cursor.svg', iconClass: 'home-tech-icon-mono' },
]

const innerOrbitStacks = [
  { name: 'copilot', icon: '/tech_stack_icons/copilot.svg', iconClass: 'home-tech-icon-mono' },
  { name: 'claude', icon: '/tech_stack_icons/claude.svg' },
  { name: 'augment', icon: '/tech_stack_icons/augment.svg', iconClass: 'home-tech-icon-mono' },
  { name: 'antigravity', icon: '/tech_stack_icons/antigravity.svg' },
]

const featuredLinks = [
  { label: 'Blog', to: '/posts' },
  { label: 'Notes', to: '/notes' },
  { label: 'Projects', to: '/projects' },
  { label: 'Friends', to: '/friends' },
  { label: 'Podcasts', to: '/podcasts' },
  { label: 'Photos', to: '/photos' },
]

const techStack = [
  { name: 'C++', icon: '/my_tech_stack_icons/c++.svg' },
  { name: 'Celery', icon: '/my_tech_stack_icons/celery.svg' },
  { name: 'CSS', icon: '/my_tech_stack_icons/css.svg' },
  { name: 'Django', icon: '/my_tech_stack_icons/django.svg' },
  { name: 'Docker', icon: '/my_tech_stack_icons/docker.svg' },
  { name: 'ESLint', icon: '/my_tech_stack_icons/eslint.svg' },
  { name: 'FastAPI', icon: '/my_tech_stack_icons/fastapi.svg' },
  { name: 'Git', icon: '/my_tech_stack_icons/git.svg' },
  { name: 'HTML', icon: '/my_tech_stack_icons/html.svg' },
  { name: 'JavaScript', icon: '/my_tech_stack_icons/javascript.svg' },
  { name: 'Linux', icon: '/my_tech_stack_icons/linux.svg' },
  { name: 'MySQL', icon: '/my_tech_stack_icons/mysql.svg' },
  { name: 'Nginx', icon: '/my_tech_stack_icons/nginx.svg' },
  { name: 'PostgreSQL', icon: '/my_tech_stack_icons/postgresql.svg' },
  { name: 'Python', icon: '/my_tech_stack_icons/python.svg' },
  { name: 'RabbitMQ', icon: '/my_tech_stack_icons/rabbitmq.svg' },
  { name: 'React', icon: '/my_tech_stack_icons/react.svg' },
  { name: 'Redis', icon: '/my_tech_stack_icons/redis.svg' },
  { name: 'TypeScript', icon: '/my_tech_stack_icons/typescript.svg' },
  { name: 'UnoCSS', icon: '/my_tech_stack_icons/unocss.svg' },
  { name: 'Vite', icon: '/my_tech_stack_icons/vite.svg' },
  { name: 'Vue', icon: '/my_tech_stack_icons/vue.svg' },
]

const homeAnalytics = ref(createEmptyAnalytics())
const homeAnalyticsState = ref('loading')
const homeContentRef = ref(null)

const analyticsCards = computed(() => {
  const overview = homeAnalytics.value.overview
  const trends = homeAnalytics.value.trends
  const caption = formatPeriodLabel(overview.period_label || trends.period_label) || t('home.analytics.lastDays', { count: 30 })

  return ANALYTICS_CARD_DEFINITIONS.map((metric) => {
    const change = computeTrendDelta(trends[metric.key])
    const placeholder = homeAnalyticsState.value !== 'available'

    return {
      key: metric.key,
      label: t(metric.labelKey),
      caption,
      value: formatMetricValue(overview[metric.key]),
      changeIcon: formatChangeIcon(change, homeAnalyticsState.value),
      changeText: formatChangeText(change, homeAnalyticsState.value),
      placeholder,
    }
  })
})

function createEmptyAnalytics() {
  return {
    overview: {
      period_label: 'Last 30 Days',
      pageviews: null,
      visitors: null,
      visits: null,
    },
    trends: {
      period_label: 'Last 14 Days',
      labels: [],
      pageviews: [],
      visitors: [],
      visits: [],
    },
  }
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '')
    return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeNumberArray(value) {
  if (!Array.isArray(value))
    return []

  return value.map(item => normalizeNumber(item) ?? 0)
}

function normalizeAnalytics(payload) {
  const fallback = createEmptyAnalytics()
  const overview = payload?.overview ?? {}
  const trends = payload?.trends ?? {}

  return {
    overview: {
      period_label: overview.period_label || fallback.overview.period_label,
      pageviews: normalizeNumber(overview.pageviews),
      visitors: normalizeNumber(overview.visitors),
      visits: normalizeNumber(overview.visits),
    },
    trends: {
      period_label: trends.period_label || fallback.trends.period_label,
      labels: Array.isArray(trends.labels) ? trends.labels : [],
      pageviews: normalizeNumberArray(trends.pageviews),
      visitors: normalizeNumberArray(trends.visitors),
      visits: normalizeNumberArray(trends.visits),
    },
  }
}

function formatPeriodLabel(value) {
  if (!value)
    return ''

  const normalized = `${value}`.trim()
  const match = normalized.match(/^Last\s+(\d+)\s+Days?$/i) || normalized.match(/^最近\s+(\d+)\s+天$/)
  if (match)
    return t('home.analytics.lastDays', { count: match[1] })

  if (/^All\s+Time$/i.test(normalized) || normalized === '全部时间')
    return t('home.analytics.allTime')

  return normalized
}

function formatMetricValue(value) {
  if (value === null || value === undefined)
    return '--'

  return new Intl.NumberFormat(getCurrentLocale()).format(value)
}

function computeTrendDelta(values) {
  if (!Array.isArray(values) || values.length < 2)
    return null

  const midpoint = Math.floor(values.length / 2)
  if (midpoint === 0)
    return null

  const previous = values.slice(0, midpoint).reduce((total, item) => total + item, 0)
  const current = values.slice(midpoint).reduce((total, item) => total + item, 0)
  const baseline = Math.max(previous, 1)

  return ((current - previous) / baseline) * 100
}

function formatChangeIcon(change, state) {
  if (state !== 'available' || change === null)
    return '•'

  if (Math.abs(change) < 0.05)
    return '→'

  return change > 0 ? '↑' : '↓'
}

function formatChangeText(change, state) {
  if (state === 'loading')
    return t('home.analytics.syncing')

  if (state === 'error')
    return t('home.analytics.failed')

  if (state !== 'available')
    return t('home.analytics.waiting')

  if (change === null)
    return t('home.analytics.noChange')

  const absolute = Math.abs(change)
  return `${absolute >= 100 ? Math.round(absolute) : absolute.toFixed(1)}%`
}

function orbitItemStyle(index, total) {
  return {
    '--orbit-angle': `${(360 / total) * index}deg`,
    '--float-delay': `${index * 0.55}s`,
  }
}

function sortHomeEntryTargets(targets) {
  return targets.sort((a, b) => {
    const aRect = a.getBoundingClientRect()
    const bRect = b.getBoundingClientRect()

    return aRect.top - bRect.top || aRect.left - bRect.left
  })
}

function animateHomeEntryTargets(targets, options) {
  if (!targets.length)
    return

  animate(
    targets,
    {
      opacity: [0, 1],
      filter: ['blur(8px)', 'blur(0px)'],
      transform: ['translateY(-8px)', 'translateY(0px)'],
    },
    {
      duration: 0.95,
      ease: [0, 0, 0.2, 1],
      fill: 'both',
      ...options,
    },
  )
}

function playHomeEntryAnimation() {
  const textTargets = sortHomeEntryTargets(
    Array.from(homeContentRef.value?.querySelectorAll(HOME_ENTRY_TEXT_TARGET_SELECTOR) ?? []),
  )
  const visualTargets = Array.from(homeContentRef.value?.querySelectorAll(HOME_ENTRY_VISUAL_TARGET_SELECTOR) ?? [])

  animateHomeEntryTargets(textTargets, {
    delay: index => 0.12 + index * 0.075,
  })
  animateHomeEntryTargets(visualTargets, {
    delay: 0.16,
  })
}

async function loadHomeAnalytics() {
  homeAnalyticsState.value = 'loading'

  try {
    const payload = await fetchHomeAggregate()
    homeAnalytics.value = normalizeAnalytics(payload?.analytics)
    const ds = payload?.analytics?.data_state
    homeAnalyticsState.value = ds === 'available' ? 'available' : ds === 'error' ? 'error' : 'unavailable'
  }
  catch (error) {
    console.error('Failed to load homepage analytics:', error)
    homeAnalytics.value = createEmptyAnalytics()
    homeAnalyticsState.value = 'error'
  }
}

onMounted(() => {
  setPageTitle(t('home.pageTitle'))
  loadHomeAnalytics()
  playHomeEntryAnimation()
})

watch(currentLanguage, () => {
  homeAnalytics.value = normalizeAnalytics(homeAnalytics.value)
  setPageTitle(t('home.pageTitle'))
})
</script>
