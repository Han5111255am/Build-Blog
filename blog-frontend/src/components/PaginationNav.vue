<template>
  <div v-if="hasPrev || hasNext" class="mt-8 flex items-center justify-between gap-4 border-t border-[var(--c-border)] pt-5 text-sm">
    <RouterLink
      v-if="hasPrev"
      class="text-link no-underline"
      :to="buildLink(currentPage - 1)"
    >
      {{ t('pagination.previous') }}
    </RouterLink>
    <span v-else class="h-10" />

    <span class="text-12px font-mono uppercase tracking-[0.22em] text-[var(--c-soft)]">
      {{ t('pagination.page', { page: currentPage }) }}
    </span>

    <RouterLink
      v-if="hasNext"
      class="text-link no-underline"
      :to="buildLink(currentPage + 1)"
    >
      {{ t('pagination.next') }}
    </RouterLink>
    <span v-else class="h-10" />
  </div>
</template>

<script setup>
import { t } from '../lib/i18n'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  hasPrev: {
    type: Boolean,
    default: false,
  },
  hasNext: {
    type: Boolean,
    default: false,
  },
  extraQuery: {
    type: Object,
    default: () => ({}),
  },
  basePath: {
    type: String,
    required: true,
  },
})

function buildLink(page) {
  if (page <= 1)
    return {
      path: props.basePath,
      query: props.extraQuery,
    }

  return {
    path: props.basePath,
    query: {
      ...props.extraQuery,
      page,
    },
  }
}
</script>
