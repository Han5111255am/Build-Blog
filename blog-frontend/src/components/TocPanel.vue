<template>
  <aside
    v-if="items.length"
    class="article-toc-rail"
    aria-label="Table of contents"
  >
    <nav class="article-toc-panel" :aria-label="t('toc.title')">
      <button
        class="article-toc-trigger"
        type="button"
        :aria-label="t('toc.title')"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <div class="article-toc-links">
        <a
          v-for="item in items"
          :key="`${item.href}-${item.depth}-${item.title}`"
          :href="item.href || '#'"
          class="article-toc-link"
          :style="{ paddingLeft: `${item.depth * 0.78}rem` }"
        >
          {{ item.title }}
        </a>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { t } from '../lib/i18n'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>
