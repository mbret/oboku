import { signal, SIGNAL_RESET, useSignalValue } from "reactjrx"
import { STORAGE_PROFILE_KEY } from "../../config"
import { CancelError } from "../../errors/errors.shared"
import { profilesBroadcast } from "../profilesBroadcast"

const activeProfileIdSignal = signal<string | undefined>({
  default: undefined,
})

export const getActiveProfileId = () =>
  localStorage.getItem(STORAGE_PROFILE_KEY) || undefined

export const useActiveProfileId = () => useSignalValue(activeProfileIdSignal)

/**
 * Throws a `CancelError` once the active profile is no longer `profileId`, as
 * after another tab switched it: a request sent now would carry the other
 * profile's session cookies.
 */
export const cancelUnlessProfileIsActive = (profileId: string | undefined) => {
  const isProfileStillActive = getActiveProfileId() === profileId

  if (!isProfileStillActive) throw new CancelError()
}

export const setActiveProfileId = (profileId: string) => {
  localStorage.setItem(STORAGE_PROFILE_KEY, profileId)
  activeProfileIdSignal.update(profileId)
  profilesBroadcast.broadcast("profiles-changed")
}

export const clearActiveProfileId = () => {
  localStorage.removeItem(STORAGE_PROFILE_KEY)
  activeProfileIdSignal.update(SIGNAL_RESET)
  profilesBroadcast.broadcast("profiles-changed")
}

/** @returns whether this tab's active profile changed */
export const syncActiveProfileIdFromStorage = () => {
  const storedProfileId = getActiveProfileId()
  const isStoredProfileActive =
    storedProfileId === activeProfileIdSignal.getValue()

  if (isStoredProfileActive) return false

  activeProfileIdSignal.update(storedProfileId ?? SIGNAL_RESET)

  return true
}

syncActiveProfileIdFromStorage()
