<template>
  <div ref="root" :class="className" v-html="html || ''" />
</template>

<script setup>
import { nextTick, onMounted, onUpdated, ref } from 'vue'

import { assignHeadingIds } from '../lib/content'
import { renderMathContent } from '../lib/math'

const root = ref(null)

const props = defineProps({
  className: {
    type: String,
    default: '',
  },
  html: {
    type: String,
    default: '',
  },
  renderMath: {
    type: Boolean,
    default: false,
  },
})

async function renderMathIfNeeded() {
  if (!root.value || !props.html)
    return

  assignHeadingIds(root.value)
  if (!props.renderMath)
    return

  await nextTick()
  await renderMathContent(root.value)
}

onMounted(renderMathIfNeeded)
onUpdated(renderMathIfNeeded)
</script>
