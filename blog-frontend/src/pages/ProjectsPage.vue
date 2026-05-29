<template>
  <section class="content-wide">
    <header class="page-hero">
      <div class="page-hero-copy">
        <h1 class="page-heading">{{ t('projects.pageTitle') }}</h1>
        <p class="page-intro">
          {{ t('projects.intro') }}
        </p>
        <div class="project-action-links" :aria-label="t('projects.actionLinksAria')">
          <a
            href="https://github.com/example"
            target="_blank"
            rel="noopener noreferrer"
            class="project-action-link project-action-link-blue"
          >
            <span class="project-action-link-icon" aria-hidden="true">
              <svg class="project-action-link-icon-outline" viewBox="0 0 256 256">
                <path d="M128 24C70.6 24 24 70.6 24 128c0 45.9 29.8 84.9 71.1 98.7 5.2 1 7.1-2.2 7.1-5v-17.5c-28.9 6.3-35-12.2-35-12.2-4.8-12.1-11.6-15.3-11.6-15.3-9.5-6.5.7-6.4.7-6.4 10.6.7 16.1 10.9 16.1 10.9 9.3 16 24.5 11.4 30.5 8.7.9-6.8 3.7-11.4 6.7-14-23.1-2.6-47.4-11.6-47.4-51.4 0-11.3 4-20.5 10.7-27.8-1.1-2.6-4.7-13.1 1-27.3 0 0 8.8-2.8 28.8 10.6a99.8 99.8 0 0 1 52.4 0c20-13.4 28.8-10.6 28.8-10.6 5.7 14.2 2.1 24.7 1 27.3 6.7 7.3 10.7 16.5 10.7 27.8 0 39.9-24.3 48.8-47.5 51.4 3.8 3.2 7.2 9.6 7.2 19.4v28.8c0 2.8 1.8 6.1 7.1 5C202.2 212.9 232 173.9 232 128c0-57.4-46.6-104-104-104Z" fill="currentColor" opacity="0.72"/>
              </svg>
              <svg class="project-action-link-icon-fill" viewBox="0 0 256 256">
                <path d="M128 24C70.6 24 24 70.6 24 128c0 45.9 29.8 84.9 71.1 98.7 5.2 1 7.1-2.2 7.1-5v-17.5c-28.9 6.3-35-12.2-35-12.2-4.8-12.1-11.6-15.3-11.6-15.3-9.5-6.5.7-6.4.7-6.4 10.6.7 16.1 10.9 16.1 10.9 9.3 16 24.5 11.4 30.5 8.7.9-6.8 3.7-11.4 6.7-14-23.1-2.6-47.4-11.6-47.4-51.4 0-11.3 4-20.5 10.7-27.8-1.1-2.6-4.7-13.1 1-27.3 0 0 8.8-2.8 28.8 10.6a99.8 99.8 0 0 1 52.4 0c20-13.4 28.8-10.6 28.8-10.6 5.7 14.2 2.1 24.7 1 27.3 6.7 7.3 10.7 16.5 10.7 27.8 0 39.9-24.3 48.8-47.5 51.4 3.8 3.2 7.2 9.6 7.2 19.4v28.8c0 2.8 1.8 6.1 7.1 5C202.2 212.9 232 173.9 232 128c0-57.4-46.6-104-104-104Z" fill="currentColor"/>
              </svg>
            </span>
            <span>GitHub</span>
          </a>
          <a
            href="https://github.com/example?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            class="project-action-link project-action-link-amber"
          >
            <span class="project-action-link-icon" aria-hidden="true">
              <svg class="antfu-project-link-icon-outline" viewBox="0 0 256 256">
                <path d="M168 136l-32 32v40a8 8 0 0 1-16 0v-40l-32-32-22.9 7.6a16 16 0 0 1-20.2-20.2L52.6 100l-20.2-20.1a16 16 0 0 1 20.2-20.2L76 67.4 108 35.4a28 28 0 0 1 39.6 0l17.5 17.5 28.3-9.4a16 16 0 0 1 20.2 20.2l-9.4 28.3 17.5 17.5a28 28 0 0 1 0 39.6l-32 32a27.8 27.8 0 0 1-19.8 8.2Z" fill="currentColor" opacity="0.18"/>
                <path d="M168 136l-32 32v40a8 8 0 0 1-16 0v-40l-32-32-22.9 7.6a16 16 0 0 1-20.2-20.2L52.6 100l-20.2-20.1a16 16 0 0 1 20.2-20.2L76 67.4 108 35.4a28 28 0 0 1 39.6 0l17.5 17.5 28.3-9.4a16 16 0 0 1 20.2 20.2l-9.4 28.3 17.5 17.5a28 28 0 0 1 0 39.6l-32 32a27.8 27.8 0 0 1-19.8 8.2Zm-40 12.7 28.7-28.6a12 12 0 0 1 8.4-3.5h3.1a11.9 11.9 0 0 0 8.5-3.5l32-32a12 12 0 0 0 0-17l-21-21 9.9-29.8-29.8 9.9-21-21a12 12 0 0 0-17 0l-32 32a12 12 0 0 1-5.4 3.1l-28.1 9.4 20.9 20.9a12 12 0 0 1 3.1 12.3l-9.4 28.1 20.9-6.9a12 12 0 0 1 12.3 3.1L128 148.7Z" fill="currentColor"/>
              </svg>
              <svg class="project-action-link-icon-fill" viewBox="0 0 256 256">
                <path d="M221.3 109.7 203.8 92.2l9.4-28.3a16 16 0 0 0-20.2-20.2l-28.3 9.4-17.5-17.5a28 28 0 0 0-39.6 0L76 67.4l-23.4-7.7a16 16 0 0 0-20.2 20.2L52.6 100l-7.7 23.4a16 16 0 0 0 20.2 20.2L88 136l32 32v40a8 8 0 0 0 16 0v-40l32-32a28 28 0 0 0 39.6 0l13.7-13.7a28 28 0 0 0 0-39.6Z" fill="currentColor"/>
              </svg>
            </span>
            <span>Recent Releases</span>
          </a>
        </div>
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
      :title="t('projects.listErrorTitle')"
      :description="t('projects.listErrorDescription')"
      :action-label="t('common.reload')"
      @action="load"
    />

    <StateBlock
      v-else-if="!items.length"
      :eyebrow="t('common.emptyState')"
      :title="t('projects.emptyTitle')"
      :description="t('projects.emptyDescription')"
    />

    <div v-else class="entry-list">
      <article
        v-for="item in items"
        :key="item.slug"
        class="simple-card"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <RouterLink
              :to="`/projects/${item.slug}`"
              class="simple-card-title text-link no-underline"
            >
              {{ item.name }}
            </RouterLink>
            <p class="simple-card-desc">
              {{ item.description || t('projects.noDescription') }}
            </p>
            <div v-if="item.tags?.length" class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="tag in item.tags"
                :key="tag.slug || tag.name"
                class="inline-tag"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
          <div class="simple-card-meta justify-end">
            <RouterLink :to="`/projects/${item.slug}`" class="text-link no-underline">
              {{ t('projects.internalPage') }}
            </RouterLink>
            <a
              v-if="item.url"
              class="text-link no-underline"
              :href="item.url"
              target="_blank"
              rel="noreferrer"
            >
              {{ t('projects.projectLink') }}
            </a>
            <a
              v-if="item.repo_url"
              class="text-link no-underline"
              :href="item.repo_url"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </article>
    </div>

    <PaginationNav
      base-path="/projects"
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
import { pageFromQuery, setPageTitle } from '../lib/content'
import { currentLanguage, t } from '../lib/i18n'
import { extractCollectionState } from '../lib/ssg'

const route = useRoute()
const initialItems = extractCollectionState(route.meta.state, 'projects')
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
    const data = await fetchCollection('projects', currentPage.value)
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
  setPageTitle(t('projects.pageTitle'))
  load()
})

watch(currentLanguage, () => {
  setPageTitle(t('projects.pageTitle'))
})
</script>
