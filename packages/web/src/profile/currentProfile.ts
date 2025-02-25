import { STORAGE_PROFILE_KEY } from "../constants.shared"
import { signal } from "reactjrx"

export const getProfile = () => {
  return localStorage.getItem(STORAGE_PROFILE_KEY) || undefined
}

export const currentProfileSignal = signal<string | undefined>({
  default: getProfile() || undefined,
})

export const setProfile = (profile: string) => {
  localStorage.setItem(STORAGE_PROFILE_KEY, profile)
}

export const removeProfile = () => {
  localStorage.removeItem(STORAGE_PROFILE_KEY)
}
