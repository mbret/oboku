import { BehaviorSubject } from "rxjs"
import type { AuthSession } from "./types"

export const authState = new BehaviorSubject<
  | AuthSession
  | null
>(null)
