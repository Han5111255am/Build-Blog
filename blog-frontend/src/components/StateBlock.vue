<template>
  <section class="state-shell flex min-h-72 flex-col items-center justify-center gap-4 text-center">
    <p class="section-title">{{ eyebrow }}</p>
    <h2 class="max-w-xl text-2xl font-semibold leading-tight text-[var(--c-text)]">
      {{ title }}
    </h2>
    <p class="max-w-xl text-sm leading-7 text-[var(--c-muted)]">
      {{ description }}
    </p>
    <button
      v-if="actionLabel"
      type="button"
      class="text-link mt-2 border-0 bg-transparent p-0 text-sm"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </section>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  actionLabel: {
    type: String,
    default: '',
  },
})

defineEmits(['action'])
</script>
