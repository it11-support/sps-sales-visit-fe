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

export interface IActivity {
  id: number
  assigned_by: IUser
  assigned_to: IUser
  customer_id: string
  activity_type_id: number
  scheduled_date: Date
  notes: string
  status: string
  customer: ICustomerData 
  activity: IActivityType
  lat?: number
  lng?: number
  accuracy?: number
  check_in?: Date
  check_out?: Date
  image_path?: string
}

export interface IActivityReport {
  products?: IProduct[]
  customer: ICustomerData
  assignment_id: number
  assignment: IActivity
  reason_qty_drop_id: number
  activity_purpose_id: number
  reason_qty_drop?: IReasonQtyDrop
  non_active_product?: string
  product_issue?: string
  next_action?: string
  additional_note?: string
  competitors: ICompetitor[]
  activity_purpose?: IActivityPurpose
}

export interface ISupplierProduct {
  supplier: string
  product: string
  price?: number
  quantity?: number  
}
