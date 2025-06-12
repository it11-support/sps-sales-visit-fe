export interface IProduct {
  ItemCode: string
  ItemName: string
  ItemGroup: string
  Weight: number
  SalesUOM: string
  PriceListIC: number
  PriceListPR: number
  PriceListEF: number
  StockPrice: number
  LaunchDate: Date
  NonActive: string
  dwh_created_at: Date
  dwh_updated_at: Date
}
