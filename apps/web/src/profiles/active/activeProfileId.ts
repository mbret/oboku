import { signal, SIGNAL_RESET } from "reactjrx"
import { STORAGE_PROFILE_KEY } from "../../config/envs"

export const setActiveProfileId = (nameHex: string) => {
  setProfile(nameHex)
  activeProfileIdSignal.update(nameHex)
}

export const clearActiveProfileId = () => {
  removeProfile()
  activeProfileIdSignal.update(SIGNAL_RESET)
}

export const getProfile = () => {
  return localStorage.getItem(STORAGE_PROFILE_KEY) || undefined
}

export const activeProfileIdSignal = signal<string | undefined>({
  default: undefined,
})

export const syncActiveProfileIdFromStorage = () => {
  const profileId = getProfile()

  activeProfileIdSignal.update(profileId ?? SIGNAL_RESET)
}

syncActiveProfileIdFromStorage()

export const setProfile = (profile: string) => {
  localStorage.setItem(STORAGE_PROFILE_KEY, profile)
}

export const removeProfile = () => {
  localStorage.removeItem(STORAGE_PROFILE_KEY)
}
