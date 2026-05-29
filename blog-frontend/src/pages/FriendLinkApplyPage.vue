<template>
  <section class="friend-apply-page">
    <FriendPageTabs active="apply" />

    <header class="friend-apply-hero">
      <h1 class="page-heading">{{ t('friends.applyPageTitle') }}</h1>
      <p class="page-intro">{{ t('friends.applyPageIntro') }}</p>
    </header>

    <section class="friend-apply-shell">
      <div class="friend-apply-copy">
        <h2>{{ t('friends.applyTitle') }}</h2>
        <p>{{ t('friends.applyDescription') }}</p>
        <p class="friend-apply-hint">{{ t('friends.pendingHint') }}</p>
      </div>

      <form class="friend-apply-form" @submit.prevent="submitApplication">
        <label>
          <span>{{ t('friends.siteName') }}</span>
          <input v-model.trim="form.site_name" required maxlength="120" :placeholder="t('friends.siteNamePlaceholder')" />
        </label>
        <label>
          <span>{{ t('friends.siteUrl') }}</span>
          <input v-model.trim="form.site_url" required type="url" maxlength="500" :placeholder="t('friends.siteUrlPlaceholder')" />
        </label>
        <label>
          <span>{{ t('friends.logoUrl') }}</span>
          <input v-model.trim="form.logo_url" required type="url" maxlength="500" :placeholder="t('friends.logoUrlPlaceholder')" />
        </label>
        <label>
          <span>{{ t('friends.description') }}</span>
          <input v-model.trim="form.description" required maxlength="240" :placeholder="t('friends.descriptionPlaceholder')" />
        </label>
        <label>
          <span>{{ t('friends.contactEmail') }} <em>{{ t('friends.optional') }}</em></span>
          <input v-model.trim="form.contact_email" type="email" :placeholder="t('friends.contactEmailPlaceholder')" />
        </label>
        <label>
          <span>{{ t('friends.contactNote') }} <em>{{ t('friends.optional') }}</em></span>
          <textarea v-model.trim="form.contact_note" maxlength="500" rows="4" :placeholder="t('friends.contactNotePlaceholder')" />
        </label>

        <div class="friend-apply-actions">
          <button class="friend-submit-button" type="submit" :disabled="submitting">
            <svg class="friend-submit-button-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5 3.5 6.7c-.25-.98.78-1.8 1.68-1.34l15.14 7.76c.78.4.78 1.52 0 1.92L5.18 22.8c-.9.46-1.93-.36-1.68-1.34L5 15.5l7.2-1.5L5 12.5Z" />
            </svg>
            <span>{{ submitting ? t('friends.submitting') : t('friends.submit') }}</span>
          </button>
          <p v-if="submitState === 'success'" class="friend-submit-success">
            <strong>{{ t('friends.submittedTitle') }}</strong>
            <span>{{ t('friends.submittedDescription') }}</span>
          </p>
          <p v-else-if="submitState === 'error'" class="friend-submit-error">
            {{ submitErrorMessage }}
          </p>
        </div>
      </form>
    </section>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import FriendPageTabs from '../components/FriendPageTabs.vue'
import { applyFriendLink } from '../lib/api'
import { setPageTitle } from '../lib/content'
import { currentLanguage, t } from '../lib/i18n'

const submitting = ref(false)
const submitState = ref('')
const submitErrorMessage = ref('')
const form = reactive({
  site_name: '',
  site_url: '',
  logo_url: '',
  description: '',
  contact_email: '',
  contact_note: '',
})

async function submitApplication() {
  submitting.value = true
  submitState.value = ''
  submitErrorMessage.value = ''

  try {
    await applyFriendLink({ ...form })
    Object.assign(form, {
      site_name: '',
      site_url: '',
      logo_url: '',
      description: '',
      contact_email: '',
      contact_note: '',
    })
    submitState.value = 'success'
  }
  catch (caughtError) {
    submitState.value = 'error'
    const fieldErrors = caughtError?.payload?.errors
    submitErrorMessage.value = firstFieldError(fieldErrors) || caughtError?.message || t('friends.submitFailed')
  }
  finally {
    submitting.value = false
  }
}

function firstFieldError(errors) {
  if (!errors)
    return ''

  const firstKey = Object.keys(errors)[0]
  const firstValue = firstKey ? errors[firstKey] : null
  return Array.isArray(firstValue) ? firstValue[0] : ''
}

onMounted(() => {
  setPageTitle(t('friends.applyPageTitle'))
})

watch(currentLanguage, () => {
  setPageTitle(t('friends.applyPageTitle'))
})
</script>

<style scoped>
.friend-apply-page {
  width: min(100%, 1080px);
  margin: 0 auto;
}

.friend-apply-hero {
  display: flex;
  min-height: clamp(8rem, 18vh, 12rem);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 1rem 1rem;
  text-align: center;
}

.friend-apply-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.72fr) minmax(0, 1fr);
  gap: 2rem;
  margin: clamp(1.5rem, 4vw, 3rem) auto 0;
  padding: 2rem 0 0;
  border-top: 1px solid var(--c-border);
}

.friend-apply-copy h2 {
  margin: 0;
  color: var(--c-text);
  font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.2;
}

.friend-apply-copy p {
  margin: 0.85rem 0 0;
  color: var(--c-muted);
  font-size: 0.96rem;
  line-height: 1.75;
}

.friend-apply-hint {
  color: var(--c-soft) !important;
  font-size: 0.86rem !important;
}

.friend-apply-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.friend-apply-form label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.45rem;
  color: var(--c-muted);
  font-size: 0.84rem;
}

.friend-apply-form label:nth-child(4),
.friend-apply-form label:nth-child(6),
.friend-apply-actions {
  grid-column: 1 / -1;
}

.friend-apply-form em {
  color: var(--c-soft);
  font-style: normal;
}

.friend-apply-form input,
.friend-apply-form textarea {
  width: 100%;
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.035);
  color: var(--c-text);
  padding: 0.78rem 0.9rem;
  outline: none;
}

.friend-apply-form textarea {
  resize: vertical;
}

.friend-apply-form input:focus,
.friend-apply-form textarea:focus {
  border-color: rgba(255, 255, 255, 0.28);
}

.friend-apply-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.friend-submit-button {
  display: inline-flex;
  min-height: 2.65rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid rgba(251, 113, 133, 0.34);
  border-radius: 0.3rem;
  background: rgba(244, 63, 94, 0.05);
  color: #fb7185;
  padding: 0 1.05rem;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.friend-submit-button:hover,
.friend-submit-button:focus-visible {
  border-color: rgba(251, 113, 133, 0.82);
  background: rgba(244, 63, 94, 0.13);
  color: #fda4af;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 0 3px rgba(244, 63, 94, 0.08);
  outline: none;
  transform: translateY(-1px);
}

.friend-submit-button:active {
  transform: translateY(0);
}

.friend-submit-button:disabled {
  cursor: wait;
  opacity: 0.62;
  transform: none;
}

.friend-submit-button-icon {
  display: inline-flex;
  align-items: center;
  width: 1.05rem;
  height: 1.05rem;
  fill: currentColor;
  transform: translateY(1px);
  transition: transform 160ms ease;
}

.friend-submit-button:hover .friend-submit-button-icon,
.friend-submit-button:focus-visible .friend-submit-button-icon {
  transform: translate(2px, 1px);
}

.friend-submit-success,
.friend-submit-error {
  margin: 0;
  color: var(--c-muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.friend-submit-success {
  display: grid;
  gap: 0.1rem;
}

.friend-submit-success strong {
  color: var(--c-text);
}

.friend-submit-error {
  color: #f87171;
}

@media (max-width: 720px) {
  .friend-apply-shell {
    grid-template-columns: 1fr;
  }

  .friend-apply-form {
    grid-template-columns: 1fr;
  }
}
</style>
