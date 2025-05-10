import { User } from "../user"

export interface SalesPerson {
  SlpCode: number
  SlpName: string
  Commission: number
  DataSource: string
  EmpID?: number
  GroupCode: number
  Locked: string
  U_SalesCo?: string
  UserSign: number
  dwh_created_at: Date
  dwh_updated_at: Date
  user?: User
}
