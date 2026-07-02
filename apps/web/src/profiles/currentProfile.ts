import { signal } from "reactjrx"
import { STORAGE_PROFILE_KEY } from "../config/envs"

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
