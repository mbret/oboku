import { useQuery$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"

export const useSecrets = () => {
  return useQuery$({
    queryKey: ["secrets", "all"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => db.secret.find({}).$),
        map((secrets) => secrets.map((secret) => secret.toJSON())),
      ),
  })
}
