<template>
  <SiteLayout>
    <RouterView v-slot="{ Component, route }">
      <Transition name="page-fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </SiteLayout>
</template>

<script setup>
import SiteLayout from './components/SiteLayout.vue'
</script>
