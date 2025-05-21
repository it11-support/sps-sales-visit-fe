import { ISalesInvoice } from "../salesinvoice"
import { ISalesPerson } from "../salesperson"

export interface ICustomerData {
  CardCode: string
  CardName: string
  GroupName: string
  ZipCode?: string
  Phone1?: string
  SlpName: string
  SlpCode: number
  CntctPrsn: string
  Cellular?: string
  Territory?: string
  Address?: string
  SalesSpvWawan?: string
  SalesSpvBuddy?: string
  Block?: string
  City?: string
  Country: string
  PaymentTerm?: string
  PriceList?: string
  JoinDate?: Date
  NonActive?: string
  dwh_created_at?: Date
  dwh_updated_at?: Date
  sales_person?: ISalesPerson
  sales_invoice?: ISalesInvoice[]
  invoice_count?: number
  last_transaction_date?: Date
  total_sales?: number
}
