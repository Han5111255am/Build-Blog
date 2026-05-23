<template>
  <section class="content-shell">
    <header class="page-hero">
      <div class="page-hero-copy">
        <h1 class="page-heading">{{ pageCopy.eyebrow }}</h1>
        <p class="page-intro">
          {{ pageCopy.description }}
        </p>
      </div>
    </header>

    <div v-if="loading" class="entry-list space-y-4">
      <div
        v-for="index in 4"
        :key="index"
        class="h-12 animate-pulse"
      />
    </div>
    <StateBlock
      v-else-if="error"
      :eyebrow="t('common.requestFailed')"
      :title="t('text.listErrorTitle')"
      :description="t('text.listErrorDescription')"
      :action-label="t('common.reload')"
      @action="load"
    />

    <StateBlock
      v-else-if="!items.length"
      :eyebrow="t('common.emptyState')"
      :title="t('text.emptyTitle', { title: pageCopy.title })"
      :description="t('text.emptyDescription')"
    />

    <div v-else class="entry-list">
      <section
        v-for="group in groups"
        :key="group.year"
      >
        <h2 class="entry-year">{{ group.year }}</h2>
        <RouterLink
          v-for="item in group.items"
          :key="item.slug"
          :to="`${basePath}/${item.slug}`"
          class="entry-row"
        >
          <div class="entry-main">
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
              <div class="entry-title">{{ item.title || t('text.unnamedContent') }}</div>
              <div class="entry-meta">
                <span>{{ formatMonthDay(item.published_at) }}</span>
                <template v-if="kind !== 'notes' && item.reading_time">
                  <span>·</span>
                  <span>{{ item.reading_time }}min</span>
                </template>
              </div>
            </div>
          </div>
        </RouterLink>
      </section>
    </div>

    <PaginationNav
      :base-path="basePath"
      :current-page="currentPage"
      :has-next="Boolean(pagination.next)"
      :has-prev="Boolean(pagination.previous)"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PaginationNav from '../components/PaginationNav.vue'
import StateBlock from '../components/StateBlock.vue'
import { fetchCollection } from '../lib/api'
import { formatMonthDay, pageFromQuery, setPageTitle } from '../lib/content'
import { currentLanguage, t } from '../lib/i18n'
import { extractCollectionState } from '../lib/ssg'

const props = defineProps({
  kind: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  eyebrow: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const initialItems = extractCollectionState(route.meta.state, props.kind)
const loading = ref(!initialItems)
const error = ref(null)
const items = ref(initialItems || [])
const pagination = ref({
  next: null,
  previous: null,
})

const currentPage = computed(() => pageFromQuery(route.query.page))
const basePath = computed(() => `/${props.kind}`)
const pageCopy = computed(() => {
  const namespace = props.kind === 'notes' ? 'notes' : 'posts'
  return {
    title: t(`${namespace}.title`),
    eyebrow: t(`${namespace}.eyebrow`),
    description: t(`${namespace}.description`),
  }
})
const groups = computed(() => {
  const map = new Map()

  items.value.forEach((item) => {
    const year = item.published_at ? new Date(item.published_at).getFullYear() : t('content.unpublished')
    if (!map.has(year))
      map.set(year, [])
    map.get(year).push(item)
  })

  return Array.from(map.entries()).map(([year, groupedItems]) => ({
    year,
    items: groupedItems,
  }))
})

async function load() {
  if (!route.query.page && initialItems) {
    loading.value = false
    error.value = null
    return
  }

  loading.value = true
  error.value = null

  try {
    const data = await fetchCollection(props.kind, currentPage.value)
    items.value = data.results || []
    pagination.value = {
      next: data.next,
      previous: data.previous,
    }
  }
  catch (caughtError) {
    error.value = caughtError
    items.value = []
  }
  finally {
    loading.value = false
  }
}

watch(currentPage, load)

onServerPrefetch(load)
onMounted(() => {
  setPageTitle(pageCopy.value.title)
  load()
})

watch(currentLanguage, () => {
  setPageTitle(pageCopy.value.title)
})
</script>
