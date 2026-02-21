import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, mergeMap, of } from "rxjs"
import { useMutation$ } from "reactjrx"
import type { SettingsDocType } from "../rxdb/collections/settings"
import { getSettingsDocument } from "./dbHelpers"

export const useSettingsIncrementalPatch = () =>
  useMutation$({
    mutationFn: (updateObj: Partial<SettingsDocType>) =>
      getLatestDatabase().pipe(
        mergeMap((db) => getSettingsDocument(db)),
        mergeMap((item) => {
          if (!item) return of(null)

          return from(item.incrementalPatch(updateObj))
        }),
      ),
  })
