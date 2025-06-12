export interface ICompetitor {
  id?: number | string
  name: string
  address: string
  product?: string
  price?: number
  qty?: number
  assignment_detail_id?: number
  isNew?: boolean
  rawName?: string
}
