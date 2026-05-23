<template>
  <section class="content-wide">
    <RouterLink to="/podcasts" class="subtle-link mb-5 inline-flex items-center gap-2 no-underline">
      ← {{ t('podcasts.back') }}
    </RouterLink>

    <StateBlock
      v-if="loading"
      :eyebrow="t('common.loading')"
      :title="t('podcasts.detailLoadingTitle')"
      :description="t('podcasts.detailLoadingDescription')"
    />

    <StateBlock
      v-else-if="notFound"
      :eyebrow="t('common.notFoundCode')"
      :title="t('podcasts.notFoundTitle')"
      :description="t('podcasts.notFoundDescription')"
    />

    <StateBlock
      v-else-if="error"
      :eyebrow="t('common.requestFailed')"
      :title="t('podcasts.detailErrorTitle')"
      :description="t('podcasts.detailErrorDescription')"
      :action-label="t('common.reload')"
      @action="load"
    />

    <article v-else-if="detail">
      <img
        v-if="detail.cover_url"
        :src="resolveAssetUrl(detail.cover_url)"
        :alt="detail.title"
        class="mb-6 h-58 w-full rounded-2xl object-cover"
      />
      <p class="section-title mb-4">{{ detail.platform || 'Podcast' }}</p>
      <h1 class="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
        {{ detail.title }}
      </h1>
      <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--c-muted)]">
        <span>{{ formatDate(detail.published_at) }}</span>
        <a
          v-if="detail.url"
          :href="detail.url"
          target="_blank"
          rel="noreferrer"
          class="text-link no-underline"
        >
          {{ t('podcasts.externalLink') }}
        </a>
      </div>
      <SafeRichText
        :html="detail.content_html || ''"
        class="prose prose-slate mt-8 max-w-none dark:prose-invert article-content"
      />
    </article>
  </section>
</template>

<script setup>
import { onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SafeRichText from '../components/SafeRichText.vue'
import StateBlock from '../components/StateBlock.vue'
import { ApiError, fetchDetail, resolveAssetUrl } from '../lib/api'
import { formatDate, setPageTitle } from '../lib/content'
import { t } from '../lib/i18n'
import { extractDetailState } from '../lib/ssg'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const notFound = ref(false)
const detail = ref(extractDetailState(route.meta.state, route.path))

async function load() {
  const staticDetail = extractDetailState(route.meta.state, route.path)
  if (staticDetail) {
    detail.value = staticDetail
    loading.value = false
    error.value = null
    notFound.value = false
    setPageTitle(staticDetail.title)
    return
  }

  loading.value = true
  error.value = null
  notFound.value = false

  try {
    detail.value = await fetchDetail('podcasts', route.params.slug)
    setPageTitle(detail.value.title)
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
