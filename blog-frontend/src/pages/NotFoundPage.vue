<template>
  <section class="mx-auto max-w-3xl">
    <StateBlock
      :eyebrow="t('common.notFoundCode')"
      :title="t('notFound.title')"
      :description="t('notFound.description')"
    />
  </section>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import StateBlock from '../components/StateBlock.vue'
import { setPageTitle } from '../lib/content'
import { currentLanguage, t } from '../lib/i18n'

onMounted(() => {
  setPageTitle(t('notFound.pageTitle'))
})

watch(currentLanguage, () => {
  setPageTitle(t('notFound.pageTitle'))
})
</script>
