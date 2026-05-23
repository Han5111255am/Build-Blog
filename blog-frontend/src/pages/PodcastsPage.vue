<template>
  <section class="content-wide">
    <header class="page-hero">
      <div class="page-hero-copy">
        <h1 class="page-heading">{{ t('podcasts.pageTitle') }}</h1>
        <p class="page-intro">
          {{ t('podcasts.intro') }}
        </p>
      </div>
    </header>

    <div v-if="loading" class="entry-list space-y-4">
      <div
        v-for="index in 4"
        :key="index"
        class="h-16 animate-pulse border-b border-[var(--c-border)]"
      />
    </div>

    <StateBlock
      v-else-if="error"
      :eyebrow="t('common.requestFailed')"
      :title="t('podcasts.listErrorTitle')"
      :description="t('podcasts.listErrorDescription')"
      :action-label="t('common.reload')"
      @action="load"
    />

    <StateBlock
      v-else-if="!items.length"
      :eyebrow="t('common.emptyState')"
      :title="t('podcasts.emptyTitle')"
      :description="t('podcasts.emptyDescription')"
    />

    <div v-else class="entry-list">
      <RouterLink
        v-for="item in items"
        :key="item.slug"
        :to="`/podcasts/${item.slug}`"
        class="simple-card"
      >
        <div class="flex items-start gap-4">
          <img
            v-if="item.cover_url"
            :src="resolveAssetUrl(item.cover_url)"
            :alt="item.title"
            class="h-15 w-15 flex-shrink-0 rounded-xl object-cover"
          />
          <div class="min-w-0 flex-1">
            <p class="section-title">{{ item.platform || 'Podcast' }}</p>
            <h2 class="simple-card-title mt-2">{{ item.title }}</h2>
            <p class="simple-card-meta mt-2">
              <span>{{ formatDate(item.published_at) }}</span>
            </p>
          </div>
        </div>
      </RouterLink>
    </div>

    <PaginationNav
      base-path="/podcasts"
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
import { fetchCollection, resolveAssetUrl } from '../lib/api'
import { formatDate, pageFromQuery, setPageTitle } from '../lib/content'
import { currentLanguage, t } from '../lib/i18n'
import { extractCollectionState } from '../lib/ssg'

const route = useRoute()
const initialItems = extractCollectionState(route.meta.state, 'podcasts')
const loading = ref(!initialItems)
const error = ref(null)
const items = ref(initialItems || [])
const pagination = ref({
  next: null,
  previous: null,
})

const currentPage = computed(() => pageFromQuery(route.query.page))

async function load() {
  if (!route.query.page && initialItems) {
    loading.value = false
    error.value = null
    return
  }

  loading.value = true
  error.value = null

  try {
    const data = await fetchCollection('podcasts', currentPage.value)
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
  setPageTitle(t('podcasts.pageTitle'))
  load()
})

watch(currentLanguage, () => {
  setPageTitle(t('podcasts.pageTitle'))
})
</script>
