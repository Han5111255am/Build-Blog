import type { PodcastFormValues } from '@/features/podcasts/schema/podcast-form-schema'
import type { AppLanguage } from '@/stores/ui-preferences'

interface BuildPodcastFormDefaultsOptions {
  mode: 'create' | 'edit'
  language: AppLanguage
}

export function buildPodcastFormDefaults({ language, mode }: BuildPodcastFormDefaultsOptions): PodcastFormValues {
  return {
    title: mode === 'create' ? '' : '',
    slug: '',
    platform: 'spotify',
    url: '',
    lang: language,
    published_at: '',
    cover_url: '',
    cover_asset_id: null,
    content_md: '',
  }
}
