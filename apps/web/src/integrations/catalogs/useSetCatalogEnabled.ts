import { useMutation$ } from "reactjrx"
import { from, switchMap } from "rxjs"
import { latestDatabase$ } from "../../rxdb/RxDbProvider"

export const useSetCatalogEnabled = () =>
  useMutation$({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      latestDatabase$.pipe(
        switchMap((db) => from(db.settings.setCatalogEnabled(id, isEnabled))),
      ),
  })
