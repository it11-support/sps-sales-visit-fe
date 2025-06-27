import { ICustomerData } from "../customer";

export interface ISalesInvoice {
  DocNum: number;
  DocDate: Date;
  CardCode: string;
  CardName: string;
  ItemCode?: string;
  Dscription: string;
  QtyKg: number;
  total_weight?: number;
  unitMsr?: string;
  PriceBefDisc: number
  DiscLine: number;
  DiscTotal: number;
  TotalSales: number;
  dwh_created_at: Date;
  dwh_updated_at: Date;
  customer?: ICustomerData
}

export interface ISalesSummary {
  month: string
  active_customers: number
  mom_active_customers: number
  mom_revenue: number
  revenue: number
  volume: number
  mom_volume: number
  yoy_active_customers: number
  yoy_revenue: number
  yoy_volume: number
}

export interface ISalesInvoiceData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
  prev_page_url: string | null
  first_page_url: string | null
  last_page_url: string | null
  path: string
  links: string[],
  data: ISalesInvoice[]
}
