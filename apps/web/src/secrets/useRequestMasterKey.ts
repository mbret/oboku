import { authorizeActionObservable } from "../auth/AuthorizeActionDialog"
import { useMutation$, type UseMutation$Options } from "reactjrx"

export const useRequestMasterKey = (
  options?: Omit<UseMutation$Options<string>, "mutationFn">,
) => {
  return useMutation$({
    mutationFn: () => {
      return authorizeActionObservable()
    },
    ...options,
  })
}
