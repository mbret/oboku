import { libraryStateSignal } from "../library/books/states"
import { readerSettingsStateSignal } from "../reader/settings/states"
import { bookBeingReadStateSignal } from "../reading/states"
import { localSettingsSignal } from "../settings/states"
import { libraryShelvesFiltersSignal } from "../library/shelves/filters/states"
import { collectionDetailsScreenListControlsStateSignal } from "../collections/details/CollectionDetailsScreen"
import { searchListActionsToolbarSignal } from "../search/list/states"
import type { SignalPersistenceConfig } from "reactjrx"

export const signalEntriesToPersist = [
  {
    signal: libraryStateSignal,
    version: 0,
    hydrate: ({ value }) => ({
      ...value,
      isLibraryUnlocked: false,
    }),
  } satisfies SignalPersistenceConfig<typeof libraryStateSignal>,
  { signal: libraryShelvesFiltersSignal, version: 0 },
  { signal: localSettingsSignal, version: 0 },
  { signal: bookBeingReadStateSignal, version: 0 },
  { signal: readerSettingsStateSignal, version: 0 },
  { signal: collectionDetailsScreenListControlsStateSignal, version: 0 },
  { signal: searchListActionsToolbarSignal, version: 0 },
]
