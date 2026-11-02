
export interface ISalesType {
  id: number
  code: string
  name: string
  is_active: boolean
  users_count?: number
  created_at?: string
  updated_at?: string
}

export type SalesTypePayload = Pick<
  ISalesType,
  'code' | 'name' | 'is_active'
>

export interface ISalesTypeQuery {
  search: string
  page: number
  per_page: number
  sort_by: 'id' | 'code' | 'name' | 'is_active' | 'created_at'
  sort_order: 'asc' | 'desc'
}

export interface ISalesTypePagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ISalesTypeResponse<T = ISalesType> {
  response_code: number
  message: string
  data: T
  pagination?: ISalesTypePagination
}
