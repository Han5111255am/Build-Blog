export interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  message: string
  error_code?: string
  errors?: Record<string, string[]>
}

export interface PaginatedData<T> {
  count: number
  page: number
  page_size: number
  total_pages: number
  results: T[]
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

