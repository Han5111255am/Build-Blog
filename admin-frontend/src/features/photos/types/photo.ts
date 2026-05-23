export interface PhotoListItem {
  id: number
  caption: string
  slug: string
  lang: 'zh' | 'en'
  location: string
  taken_at: string
  original_url: string
  thumbnail_url: string
  created_at: string
  updated_at: string
}

export interface PhotoListParams {
  page: number
  page_size: number
  ordering: string
  lang: '' | 'zh' | 'en'
}

export interface PhotoDetail extends PhotoListItem {
  description: string
}

