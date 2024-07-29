import { normalizedBookDownloadsStatePersist } from "../download/states"
import { libraryStateSignal } from "../library/states"
import { readerSettingsStateSignal } from "../reader/settings/states"
import { bookBeingReadStatePersist } from "../reading/states"
import { localSettingsStatePersist } from "../settings/states"
import { collectionsListSignal } from "../library/shelves/state"
import { collectionDetailsScreenListControlsStateSignal } from "../collections/CollectionDetailsScreen"
import { searchListActionsToolbarSignal } from "../search/list/states"
import { SignalPersistenceConfig } from "reactjrx"

export const signalEntriesToPersist = [
  {
    signal: libraryStateSignal,
    version: 0,
    hydrate: ({ value }) => ({
      ...value,
      isLibraryUnlocked: false
    })
  } satisfies SignalPersistenceConfig<typeof libraryStateSignal>,
  { signal: collectionsListSignal, version: 0 },
  { signal: normalizedBookDownloadsStatePersist, version: 0 },
  { signal: localSettingsStatePersist, version: 0 },
  { signal: bookBeingReadStatePersist, version: 0 },
  { signal: readerSettingsStateSignal, version: 0 },
  { signal: collectionDetailsScreenListControlsStateSignal, version: 0 },
  { signal: searchListActionsToolbarSignal, version: 0 }
]
