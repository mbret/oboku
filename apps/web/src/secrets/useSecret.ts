import { useQuery$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"

export const useSecret = (secretId?: string) => {
  return useQuery$({
    queryKey: ["secrets", "byId", secretId],
    enabled: !!secretId,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => db.secret.findOne(secretId ?? "-1").$),
        map((document) => document?.toJSON() ?? null),
      ),
  })
}
