import { IUser } from "../user"

export interface AuthState {
  token: string | null
  user: IUser | null
}
