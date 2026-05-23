import type { PodcastDetail } from '@/features/podcasts/types/podcast'
import type { PodcastFormValues } from '@/features/podcasts/schema/podcast-form-schema'

export function mapPodcastDetailToFormValues(detail: PodcastDetail): PodcastFormValues {
  const normalizedPlatform = detail.platform.toLowerCase()

  return {
    title: detail.title,
    slug: detail.slug,
    platform: isPodcastPlatform(normalizedPlatform) ? normalizedPlatform : 'spotify',
    url: detail.url,
    lang: detail.lang,
    published_at: detail.published_at ?? '',
    cover_url: detail.cover_url ?? '',
    cover_asset_id: detail.cover_asset_id ?? null,
    content_md: detail.content_md ?? '',
  }
}

function isPodcastPlatform(value: string): value is PodcastFormValues['platform'] {
  return value === 'spotify' || value === 'apple' || value === 'youtube' || value === 'rss'
}
