import type { SourceType } from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { UnsupportedMethodError } from "../../../errors/errors.shared"
import type { UseSynchronizeHook } from "../types"

export const createUnsupportedSynchronize = <
  T extends SourceType,
>(): UseSynchronizeHook<T> =>
  function useSynchronize() {
    return useMutation({
      mutationFn: async function rejectSynchronize() {
        throw new UnsupportedMethodError("This source cannot sync")
      },
    })
  }
