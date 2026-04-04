import { useQuery$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"

export const useSecrets = () => {
  return useQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "secrets", "all"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => db.secret.find({}).$),
        map((secrets) => secrets.map((secret) => secret.toJSON())),
      ),
  })
}
