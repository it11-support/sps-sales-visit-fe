import { ICustomerData } from "../customer";

export interface ISalesInvoice {
  DocNum: number;
  DocDate: Date;
  CardCode: string;
  CardName: string;
  ItemCode?: string;
  Dscription: string;
  QtyKg: number;
  unitMsr?: string;
  PriceBefDisc: number
  DiscLine: number;
  DiscTotal: number;
  TotalSales: number;
  dwh_created_at: Date;
  dwh_updated_at: Date;
  customer?: ICustomerData
}
