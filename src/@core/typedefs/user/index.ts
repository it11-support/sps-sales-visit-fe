import { Role } from "../role"
import { SalesPerson } from "../salesperson"

export interface User {
  id: number
  name: string
  username: string
  email: string,
  password?: string
  confirm_password?: string
  role_id?: number  
  role?: Role
  sales_person?: SalesPerson
  sales_person_id?: number
}
