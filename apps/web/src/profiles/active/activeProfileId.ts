import { signal, SIGNAL_RESET, useSignalValue } from "reactjrx"
import { STORAGE_PROFILE_KEY } from "../../config"

const activeProfileIdSignal = signal<string | undefined>({
  default: undefined,
})

export const getActiveProfileId = () =>
  localStorage.getItem(STORAGE_PROFILE_KEY) || undefined

export const useActiveProfileId = () => useSignalValue(activeProfileIdSignal)

export const setActiveProfileId = (profileId: string) => {
  localStorage.setItem(STORAGE_PROFILE_KEY, profileId)
  activeProfileIdSignal.update(profileId)
}

export const clearActiveProfileId = () => {
  localStorage.removeItem(STORAGE_PROFILE_KEY)
  activeProfileIdSignal.update(SIGNAL_RESET)
}

export const syncActiveProfileIdFromStorage = () => {
  activeProfileIdSignal.update(getActiveProfileId() ?? SIGNAL_RESET)
}

syncActiveProfileIdFromStorage()
