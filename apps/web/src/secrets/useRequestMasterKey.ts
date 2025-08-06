import { authorizeActionObservable } from "../auth/AuthorizeActionDialog"
import { useMutation$ } from "reactjrx"

export const useRequestMasterKey = () => {
  return useMutation$({
    mutationFn: () => {
      return authorizeActionObservable()
    },
  })
}
