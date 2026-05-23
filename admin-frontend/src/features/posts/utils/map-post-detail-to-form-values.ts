import type { PostFormValues } from '@/features/posts/schema/post-form-schema'
import type { PostDetail } from '@/features/posts/types/post'

export function mapPostDetailToFormValues(detail: PostDetail): PostFormValues {
  return {
    title: detail.title,
    slug: detail.slug,
    lang: detail.lang,
    status: detail.status,
    tag_ids: detail.tag_ids,
    summary: detail.summary,
    cover_image: detail.cover_image,
    published_at: detail.published_at ?? '',
    content_md: detail.content_md,
  }
}
