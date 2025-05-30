import { ICustomerData } from "../customer"
import { IUser } from "../user"

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
}

