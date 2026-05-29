<template>
  <nav class="friend-page-tabs" :aria-label="t('friends.tabsLabel')">
    <RouterLink
      class="friend-page-tab"
      :class="{ 'is-active': active === 'circles' }"
      to="/friends"
    >
      {{ t('friends.circlesTab') }}
    </RouterLink>
    <span class="friend-page-tab-divider" aria-hidden="true">|</span>
    <RouterLink
      class="friend-page-tab"
      :class="{ 'is-active': active === 'apply' }"
      to="/friends/apply"
    >
      {{ t('friends.applyTab') }}
    </RouterLink>
  </nav>
</template>

<script setup>
import { t } from '../lib/i18n'

defineProps({
  active: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.friend-page-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.72rem;
  padding: 1rem 1rem 0;
  color: var(--c-soft);
  font-size: clamp(0.95rem, 1.8vw, 1.08rem);
  font-weight: 700;
  line-height: 1.25;
}

.friend-page-tab {
  color: var(--c-soft);
  text-decoration: none;
  transition: color 160ms ease;
}

.friend-page-tab:hover,
.friend-page-tab:focus-visible,
.friend-page-tab.is-active {
  color: var(--c-text);
  outline: none;
}

.friend-page-tab-divider {
  opacity: 0.48;
}
</style>
