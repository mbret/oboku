import { SIGNAL_RESET } from "reactjrx"
import { authStatePersist } from "../auth/authState"
import { normalizedBookDownloadsStatePersist } from "../download/states"
import { firstTimeExperienceStatePersist } from "../firstTimeExperience/firstTimeExperienceStates"
import { libraryStateSignal } from "../library/states"
import { readerSettingsStateSignal } from "../reader/settings/states"
import { bookBeingReadStatePersist } from "../reading/states"
import { localSettingsStatePersist } from "../settings/states"

export const signalEntriesToPersist = [
  { signal: libraryStateSignal, version: 0 },
  { signal: normalizedBookDownloadsStatePersist, version: 0 },
  { signal: firstTimeExperienceStatePersist, version: 0 },
  { signal: localSettingsStatePersist, version: 0 },
  { signal: authStatePersist, version: 0 },
  { signal: bookBeingReadStatePersist, version: 0 },
  { signal: readerSettingsStateSignal, version: 0 }
]

export const resetSignalEntriesToPersist = () => {
  signalEntriesToPersist.forEach(({ signal }) => signal.setValue(SIGNAL_RESET))

  return Promise.resolve(true)
}
