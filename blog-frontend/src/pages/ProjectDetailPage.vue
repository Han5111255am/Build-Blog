<template>
  <section class="content-shell">
    <RouterLink to="/projects" class="subtle-link mb-5 inline-flex items-center gap-2 no-underline">
      ← {{ t('projects.back') }}
    </RouterLink>

    <StateBlock
      v-if="loading"
      :eyebrow="t('common.loading')"
      :title="t('projects.detailLoadingTitle')"
      :description="t('projects.detailLoadingDescription')"
    />

    <StateBlock
      v-else-if="notFound"
      :eyebrow="t('common.notFoundCode')"
      :title="t('projects.notFoundTitle')"
      :description="t('projects.notFoundDescription')"
    />

    <StateBlock
      v-else-if="error"
      :eyebrow="t('common.requestFailed')"
      :title="t('projects.detailErrorTitle')"
      :description="t('projects.detailErrorDescription')"
      :action-label="t('common.reload')"
      @action="load"
    />

    <article v-else-if="detail">
      <TocPanel :items="tocItems" />
      <p class="section-title mb-4">{{ t('projects.sectionTitle') }}</p>
      <h1 class="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
        {{ detail.name }}
      </h1>
      <p v-if="detail.summary || detail.description" class="page-intro mt-4">
        {{ detail.summary || detail.description }}
      </p>

      <div class="detail-meta-wrap mt-4 border-b border-[var(--c-border)] pb-6">
        <ArticleMeta
          :date="detail.published_at"
          :tags="detail.tags"
        />
      </div>

      <img
        v-if="detail.cover_image"
        :src="resolveAssetUrl(detail.cover_image)"
        :alt="detail.name"
        loading="eager"
        decoding="async"
        :width="getPositiveDimension(detail.cover_image_width)"
        :height="getPositiveDimension(detail.cover_image_height)"
        :style="getCoverImageStyle(detail)"
        class="mt-8 w-full rounded-2xl border border-[var(--c-border)] object-cover"
      >

      <div v-if="detail.url || detail.repo_url" class="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--c-muted)]">
        <a
          v-if="detail.url"
          :href="detail.url"
          target="_blank"
          rel="noreferrer"
          class="text-link no-underline"
        >
          {{ t('projects.address') }}
        </a>
        <a
          v-if="detail.repo_url"
          :href="detail.repo_url"
          target="_blank"
          rel="noreferrer"
          class="text-link no-underline"
        >
          GitHub
        </a>
      </div>

      <SafeRichText
        v-if="detail.content_html"
        :html="detail.content_html"
        class="article-content mt-8"
      />
      <div
        v-else
        class="mt-8 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-6 py-8 text-base leading-8 text-[var(--c-muted)]"
      >
        {{ detail.description || t('projects.noBody') }}
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ArticleMeta from '../components/ArticleMeta.vue'
import SafeRichText from '../components/SafeRichText.vue'
import StateBlock from '../components/StateBlock.vue'
import TocPanel from '../components/TocPanel.vue'
import { ApiError, fetchDetail, resolveAssetUrl } from '../lib/api'
import { normalizeToc, setPageTitle } from '../lib/content'
import { t } from '../lib/i18n'
import { extractDetailState } from '../lib/ssg'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const notFound = ref(false)
const detail = ref(extractDetailState(route.meta.state, route.path))
const tocItems = computed(() => normalizeToc(null, detail.value?.content_html))

function getPositiveDimension(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined
}

function getCoverImageStyle(project) {
  const width = getPositiveDimension(project.cover_image_width)
  const height = getPositiveDimension(project.cover_image_height)

  if (!width || !height)
    return undefined

  return {
    aspectRatio: `${width} / ${height}`,
  }
}

async function load() {
  const staticDetail = extractDetailState(route.meta.state, route.path)
  if (staticDetail) {
    detail.value = staticDetail
    loading.value = false
    error.value = null
    notFound.value = false
    setPageTitle(staticDetail.name)
    return
  }

  loading.value = true
  error.value = null
  notFound.value = false

  try {
    detail.value = await fetchDetail('projects', route.params.slug)
    setPageTitle(detail.value.name)
  }
  catch (caughtError) {
    if (caughtError instanceof ApiError && caughtError.status === 404)
      notFound.value = true
    else
      error.value = caughtError
  }
  finally {
    loading.value = false
  }
}

watch(() => route.params.slug, load)

onServerPrefetch(load)
onMounted(load)
</script>
