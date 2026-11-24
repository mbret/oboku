import {
  type DefaultError,
  type MutateOptions,
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query"
import { signal } from "reactjrx"
import {
  type DownloadBookInput,
  type DownloadBookVariables,
  downloadBookMutationKey,
} from "./downloadBookMutation"

type DownloadBookMutateOptions = MutateOptions<
  void,
  DefaultError,
  DownloadBookVariables
>

const createDownloadVariables = ({
  _id,
  links,
  file,
}: DownloadBookInput): DownloadBookVariables => ({
  _id,
  links,
  file,
  abortController: new AbortController(),
  progress: signal({ default: 0 }),
  settlement: Promise.withResolvers<void>(),
})

export const useDownloadBook = (
  options?: Pick<
    UseMutationOptions<void, DefaultError, DownloadBookVariables>,
    "meta"
  >,
) => {
  const { mutate, mutateAsync, ...mutation } = useMutation({
    ...options,
    mutationKey: downloadBookMutationKey,
    mutationFn: function awaitDownloadSettlement({
      settlement,
    }: DownloadBookVariables) {
      return settlement.promise
    },
  })

  return {
    ...mutation,
    mutate: function downloadBook(
      book: DownloadBookInput,
      mutateOptions?: DownloadBookMutateOptions,
    ) {
      mutate(createDownloadVariables(book), mutateOptions)
    },
    mutateAsync: function downloadBookAsync(
      book: DownloadBookInput,
      mutateOptions?: DownloadBookMutateOptions,
    ) {
      return mutateAsync(createDownloadVariables(book), mutateOptions)
    },
  }
}
