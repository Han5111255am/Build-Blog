import type { PhotoFormValues } from '@/features/photos/schema/photo-form-schema'
import type { AppLanguage } from '@/stores/ui-preferences'

interface BuildPhotoFormDefaultsOptions {
  mode: 'create' | 'edit'
  language: AppLanguage
}

export function buildPhotoFormDefaults({ language, mode }: BuildPhotoFormDefaultsOptions): PhotoFormValues {
  return {
    caption: mode === 'create' ? '' : '',
    slug: '',
    lang: language,
    location: '',
    taken_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    description: '',
    original_url: '',
    thumbnail_url: '',
  }
}
