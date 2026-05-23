export interface AssetListItem {
  id: number
  name: string
  url: string
  mime_type: string
  storage: string
  size: number
  created_at: string
}

export interface AssetUploadResult {
  id: number
  name: string
  url: string
  mime_type: string
  storage: string
  size: number
  created_at: string
}

export interface AssetListParams {
  page: number
  page_size: number
  search: string
  mime_type: string
  storage: string
}

