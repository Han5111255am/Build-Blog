<template>
  <svg
    v-if="name === 'podcast'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 18v4" />
    <path d="M8 22h8" />
    <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" />
    <path d="M17 11a5 5 0 0 1-10 0" />
  </svg>
  <svg
    v-else-if="name === 'photo'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4 7.5h3l1.2-2h7.6l1.2 2h3v11H4Z" />
    <circle cx="12" cy="13" r="3.1" />
    <path d="M6.8 10h1.4" />
  </svg>
  <svg
    v-else-if="name === 'github'"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.3.8-4-1.6-4-1.6a3.2 3.2 0 0 0-1.4-1.8c-1.2-.8.1-.8.1-.8a2.6 2.6 0 0 1 1.9 1.3 2.7 2.7 0 0 0 3.7 1 2.6 2.6 0 0 1 .8-1.7c-2.7-.3-5.6-1.4-5.6-6a4.7 4.7 0 0 1 1.2-3.2 4.4 4.4 0 0 1 .1-3.2s1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2a4.4 4.4 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.2 3.2c0 4.7-2.9 5.7-5.7 6a3 3 0 0 1 .9 2.3v3.4c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
  </svg>
  <svg
    v-else-if="name === 'rocket'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M5 19c2.4-.2 4.2-1.2 5.6-2.6" />
    <path d="M14.5 9.5 19 5a10.4 10.4 0 0 1-3.7 9.3l-3.9 3.1a2 2 0 0 1-2.8-.3l-1.7-2a2 2 0 0 1 .2-2.8L10 8.4A10.4 10.4 0 0 1 19 5" />
    <path d="M9 15 5 19l-1 4 4-1 4-4" />
    <circle cx="14.5" cy="9.5" r="1.5" />
  </svg>
  <svg
    v-else-if="name === 'sun'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </svg>
  <svg
    v-else
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    default: 'moon',
  },
})
</script>
