import type { PhotoDetail } from '@/features/photos/types/photo'
import type { PhotoFormValues } from '@/features/photos/schema/photo-form-schema'

export function mapPhotoDetailToFormValues(detail: PhotoDetail): PhotoFormValues {
  return {
    caption: detail.caption,
    slug: detail.slug,
    lang: detail.lang,
    location: detail.location,
    taken_at: detail.taken_at,
    description: detail.description,
    original_url: detail.original_url,
    thumbnail_url: detail.thumbnail_url,
  }
}

