import { signal, SIGNAL_RESET } from "reactjrx"
import { STORAGE_PROFILE_KEY } from "../../config/envs"

export const setActiveProfileId = (nameHex: string) => {
  setProfile(nameHex)
  activeProfileSignal.update(nameHex)
}

export const clearActiveProfileId = () => {
  removeProfile()
  activeProfileSignal.setValue(SIGNAL_RESET)
}

export const getProfile = () => {
  return localStorage.getItem(STORAGE_PROFILE_KEY) || undefined
}

export const activeProfileSignal = signal<string | undefined>({
  default: getProfile() || undefined,
})

export const setProfile = (profile: string) => {
  localStorage.setItem(STORAGE_PROFILE_KEY, profile)
}

export const removeProfile = () => {
  localStorage.removeItem(STORAGE_PROFILE_KEY)
}
