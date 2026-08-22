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
  value?: string | number
  title?: string
}

export interface ICompetitorOption extends ICompetitor {
  value: string | number | undefined
  title: string
}
