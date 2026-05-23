<template>
  <section class="content-shell">
    <RouterLink :to="backTo" class="subtle-link mb-8 inline-flex items-center gap-2 no-underline">
      ← {{ backLabel }}
    </RouterLink>

    <StateBlock
      v-if="loading"
      :eyebrow="t('common.loading')"
      :title="t('text.loadingTitle')"
      :description="t('text.loadingDescription')"
    />

    <StateBlock
      v-else-if="notFound"
      :eyebrow="t('common.notFoundCode')"
      :title="t('text.notFoundTitle')"
      :description="t('text.notFoundDescription')"
    />

    <StateBlock
      v-else-if="error"
      :eyebrow="t('common.requestFailed')"
      :title="t('text.detailErrorTitle')"
      :description="t('text.detailErrorDescription')"
      :action-label="t('common.reload')"
      @action="load"
    />

    <article v-else-if="detail">
      <TocPanel :items="tocItems" />
      <p class="section-title mb-4">{{ sectionTitle }}</p>
      <h1 class="page-heading max-w-none">
        {{ detail.title || t('text.unnamedContent') }}
      </h1>
      <p v-if="detail.summary" class="page-intro mt-4">
        {{ detail.summary }}
      </p>
      <div class="detail-meta-wrap mt-4 border-b border-[var(--c-border)] pb-6">
        <ArticleMeta
          :date="detail.published_at"
          :reading-time="detail.reading_time"
          :tags="detail.tags"
        />
      </div>
      <SafeRichText
        :html="detail.content_html || ''"
        :render-math="true"
        class="article-content mt-8"
      />
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
import { ApiError, fetchDetail } from '../lib/api'
import { normalizeToc, setPageTitle } from '../lib/content'
import { t } from '../lib/i18n'
import { extractDetailState } from '../lib/ssg'

const props = defineProps({
  kind: {
    type: String,
    required: true,
  },
  backLabel: {
    type: String,
    required: true,
  },
  backTo: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const notFound = ref(false)
const detail = ref(extractDetailState(route.meta.state, route.path))
const sectionTitle = computed(() => props.kind === 'posts' ? 'Blog' : 'Notes')
const tocItems = computed(() => normalizeToc(detail.value?.toc_json, detail.value?.content_html))

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
    detail.value = await fetchDetail(props.kind, route.params.slug)
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
