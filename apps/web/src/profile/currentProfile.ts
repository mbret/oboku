import { signal } from "reactjrx"
import { configuration } from "../config/configuration"

export const getProfile = () => {
  return localStorage.getItem(configuration.STORAGE_PROFILE_KEY) || undefined
}

export const currentProfileSignal = signal<string | undefined>({
  default: getProfile() || undefined,
})

export const setProfile = (profile: string) => {
  localStorage.setItem(configuration.STORAGE_PROFILE_KEY, profile)
}

export const removeProfile = () => {
  localStorage.removeItem(configuration.STORAGE_PROFILE_KEY)
}
