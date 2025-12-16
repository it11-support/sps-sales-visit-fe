import { ICompetitor } from "../competitor"
import { ICustomerData } from "../customer"
import { IProduct } from "../product"
import { IUser } from "../user"

export interface IReasonQtyDrop {
  id: number
  reason: string
}

export interface IActivityPurpose {
  id: number
  purpose: string
}

export interface IActivityType {
  id: number
  name: string
}

export interface IActivity extends FormData {
  id: number
  assigned_by: IUser
  assigned_to: IUser
  customer_id: string
  activity_type_id: number
  scheduled_date: Date
  notes: string
  status: string
  customers: ICustomerData[] 
  activity: IActivityType
  lat?: number
  lng?: number
  accuracy?: number
  check_in?: string
  check_out?: string
  image_path?: string
  file?: File
  activity_details?: IActivityReport[]
}

export interface IActivityDetails {
  reason_qty_drop: IReasonQtyDrop
  activity_purpose: IActivityPurpose
}

interface GrowthPeriodData {
  month: number;
  total_amount: string;
  total_items: number;
}

interface CompanyGrowth {
  growth_percent: string | null;
  [period: string]: string | GrowthPeriodData | null;
}

export interface GrowthResponse {
  [companyId: string]: CompanyGrowth;
}

export interface IActivityReport {
  products?: IProduct[]
  customer?: ICustomerData
  customers?: ICustomerData[]
  assignment_id: number
  assignment: IActivity
  reason_qty_drop_ids?: number[]
  activity_purpose_ids?: number[]
  assignment_details?: IActivityDetails
  reason_qty_drops?: IReasonQtyDrop[]
  non_active_product?: string
  product_issue?: string
  group_growth?: GrowthResponse
  next_action?: string
  additional_note?: string
  competitors: ICompetitor[]
  activity_purposes?: IActivityPurpose[]
  image_path?: string
  accuracy?: string
  check_in?: string
  check_out?: string
  lat?: string
  lng?: string
}

export interface ISupplierProduct {
  supplier: string
  product: string
  price?: number
  quantity?: number  
}
