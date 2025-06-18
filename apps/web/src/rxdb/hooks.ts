import { useMutation$ } from "reactjrx"
import { latestDatabase$ } from "./RxDbProvider"

export const useDocumentIncrementalPatch = <T>() => {
  return useMutation$({
    mutationFn: (_patch: T) => {
      return latestDatabase$.pipe()
    },
  })
}
