export interface PodcastListItem {
  id: number
  title: string
  slug: string
  platform: 'spotify' | 'apple' | 'youtube' | 'rss'
  url: string
  lang: 'zh' | 'en'
  cover_asset_id?: number | null
  cover_url: string
  published_at: string
  created_at: string
  updated_at: string
}

export interface PodcastListParams {
  page: number
  page_size: number
  search: string
  platform: string
  lang: '' | 'zh' | 'en'
}

export interface PodcastDetail extends PodcastListItem {
  content_md: string
  content_html: string
}

