import {  useSignalValue } from "reactjrx"
import { authState } from "./states"

export const useIsAuthenticated = () => {
  return !!useSignalValue(authState).access_token
}
