import { useQuery$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"

export const useSecret = (secretId?: string) => {
  return useQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "secrets", "byId", secretId],
    enabled: !!secretId,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => db.secret.findOne(secretId ?? "-1").$),
        map((document) => document?.toJSON() ?? null),
      ),
  })
}
