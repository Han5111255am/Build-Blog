<template>
  <section class="content-gallery">
    <header class="page-hero content-wide">
      <div class="page-hero-copy">
        <h1 class="page-heading">{{ t('photos.pageTitle') }}</h1>
        <p class="page-intro">
          {{ t('photos.intro') }}
        </p>
      </div>
    </header>

    <div v-if="loading" class="photo-grid mt-10">
      <div
        v-for="index in 6"
        :key="index"
        class="photo-grid-item h-52 animate-pulse rounded-[1rem] border border-[var(--c-border)]"
      />
    </div>

    <StateBlock
      v-else-if="error"
      :eyebrow="t('common.requestFailed')"
      :title="t('photos.listErrorTitle')"
      :description="t('photos.listErrorDescription')"
      :action-label="t('common.reload')"
      @action="load"
    />

    <StateBlock
      v-else-if="!items.length"
      :eyebrow="t('common.emptyState')"
      :title="t('photos.emptyTitle')"
      :description="t('photos.emptyDescription')"
    />

    <div v-else class="photo-grid mt-10">
      <a
        v-for="(item, index) in items"
        :key="item.id"
        class="photo-grid-item block overflow-hidden no-underline transition-transform duration-300 hover:-translate-y-1"
        :href="resolveAssetUrl(item.original_url || item.thumbnail_url)"
        target="_blank"
        rel="noreferrer"
      >
        <img
          :src="resolveAssetUrl(item.thumbnail_url || item.original_url)"
          :alt="item.caption || t('photos.alt')"
          decoding="async"
          :loading="getPhotoLoading(index)"
          class="w-full rounded-[1rem] object-cover"
        />
        <div class="px-1 pb-1 pt-3">
          <p class="text-sm font-medium text-[var(--c-muted)]">
            {{ item.caption || t('photos.unnamed') }}
          </p>
          <p class="mt-2 text-sm leading-6 text-[var(--c-muted)]">
            {{ item.location || item.description || t('photos.noLocation') }}
          </p>
          <p class="mt-3 text-11px font-mono uppercase tracking-[0.22em] text-[var(--c-soft)]">
            {{ formatDateTime(item.taken_at) }}
          </p>
        </div>
      </a>
    </div>

    <PaginationNav
      base-path="/photos"
      :current-page="currentPage"
      :has-next="Boolean(pagination.next)"
      :has-prev="Boolean(pagination.previous)"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PaginationNav from '../components/PaginationNav.vue'
import StateBlock from '../components/StateBlock.vue'
import { fetchCollection, resolveAssetUrl } from '../lib/api'
import { formatDateTime, pageFromQuery, setPageTitle } from '../lib/content'
import { currentLanguage, t } from '../lib/i18n'

const route = useRoute()
const PRIORITY_PHOTO_COUNT = 6
const loading = ref(true)
const error = ref(null)
const items = ref([])
const pagination = ref({
  next: null,
  previous: null,
})

const currentPage = computed(() => pageFromQuery(route.query.page))

function getPhotoLoading(index) {
  return index < PRIORITY_PHOTO_COUNT ? undefined : 'lazy'
}

async function load() {
  loading.value = true
  error.value = null

  try {
    const data = await fetchCollection('photos', currentPage.value)
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

onMounted(() => {
  setPageTitle(t('photos.pageTitle'))
  load()
})

watch(currentLanguage, () => {
  setPageTitle(t('photos.pageTitle'))
})
</script>
