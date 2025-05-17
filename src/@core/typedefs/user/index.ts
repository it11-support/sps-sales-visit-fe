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
  role?: IRole
  sales_person?: ISalesPerson
  sales_person_id?: number
}
