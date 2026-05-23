<template>
  <div class="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm leading-7 text-[var(--c-soft)]">
    <span>{{ formatDate(date) }}</span>
    <span v-if="readingTime">· {{ formatReadingTime(readingTime) }}</span>
    <template v-if="tags?.length">
      <span>·</span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in tags"
          :key="tag.slug || tag.name"
          class="inline-tag"
        >
          {{ tag.name }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { formatDate, formatReadingTime } from '../lib/content'

defineProps({
  date: {
    type: String,
    default: '',
  },
  readingTime: {
    type: Number,
    default: 0,
  },
  tags: {
    type: Array,
    default: () => [],
  },
})
</script>
