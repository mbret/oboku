import { normalizedBookDownloadsStatePersist } from "../download/states"
import { firstTimeExperienceStatePersist } from "../firstTimeExperience/firstTimeExperienceStates"
import { libraryStateSignal } from "../library/states"
import { readerSettingsStateSignal } from "../reader/settings/states"
import { bookBeingReadStatePersist } from "../reading/states"
import { localSettingsStatePersist } from "../settings/states"
import { collectionsListSignal } from "../library/collections/state"
import { collectionDetailsScreenListControlsStateSignal } from "../collections/CollectionDetailsScreen"

export const signalEntriesToPersist = [
  { signal: libraryStateSignal, version: 0 },
  { signal: collectionsListSignal, version: 0 },
  { signal: normalizedBookDownloadsStatePersist, version: 0 },
  { signal: firstTimeExperienceStatePersist, version: 0 },
  { signal: localSettingsStatePersist, version: 0 },
  { signal: bookBeingReadStatePersist, version: 0 },
  { signal: readerSettingsStateSignal, version: 0 },
  { signal: collectionDetailsScreenListControlsStateSignal, version: 0 }
]
