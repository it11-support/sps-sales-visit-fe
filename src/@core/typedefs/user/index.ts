import { IRole } from "../role"
import { ISalesPerson } from "../salesperson"

export interface IUser {
  id: number
  name: string
  username: string
  email: string,
  password?: string
  confirm_password?: string
  role_id?: number  
  role?: IRole,
  team?: {id: number, name: string}
  team_id?: number
  sales_person?: ISalesPerson[]
  bbs_sales_person_id?: number
  spv_sales_person_id?: number
}
