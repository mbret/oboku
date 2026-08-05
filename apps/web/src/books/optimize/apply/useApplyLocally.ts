import {
  updateArchive,
  type WebArchiveUpdateAction,
} from "@oboku/archive-metadata/web"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import {
  matchMutation,
  useIsMutating,
  useMutation,
  useMutationState,
  useQueryClient,
  type Mutation,
  type UseMutationOptions,
} from "@tanstack/react-query"
import { BlobReader, ZipReader } from "@zip.js/zip.js"
import { useCallback } from "react"
import { BehaviorSubject } from "rxjs"
import { Logger } from "../../../debug/logger.shared"
import { getBookFile } from "../../../download/getBookFile.shared"
import { notify } from "../../../notifications/toasts"
import { dexieDb } from "../../../rxdb/dexie"
import { getFileInspectionQueryKey } from "../useFileInspection"
import { confirmApplyLocalUpdate } from "./confirmApplyLocalUpdate"

type ApplyLocalVariables = {
  bookId: string
  actions: WebArchiveUpdateAction[]
  progress$: BehaviorSubject<ApplyLocallyProgress>
}

type ApplyLocallyInput = Pick<ApplyLocalVariables, "actions" | "bookId">
type ApplyLocallyOptions = Pick<
  UseMutationOptions<void, Error, ApplyLocalVariables>,
  "meta"
>

export type ApplyLocallyProgress =
  | { phase: "preparing" }
  | { phase: "optimizing-images"; progress: number | undefined }
  | { phase: "rebuilding-book-file" }
  | { phase: "saving-locally" }
  | { phase: "refreshing-report" }

const getApplyLocallyMutationKey = () => ["books", "optimize", "apply-locally"]

type ApplyLocallyMutation = Mutation & {
  state: Mutation["state"] & {
    variables: ApplyLocalVariables
  }
}

function isApplyLocallyMutation(
  mutation: Mutation,
): mutation is ApplyLocallyMutation {
  return matchMutation(
    { exact: true, mutationKey: getApplyLocallyMutationKey() },
    mutation,
  )
}

export function useIsApplyingLocally(bookId: string): boolean {
  return (
    useIsMutating({
      mutationKey: getApplyLocallyMutationKey(),
      predicate: function matchBookApplyLocallyMutation(mutation) {
        return (
          isApplyLocallyMutation(mutation) &&
          mutation.state.variables.bookId === bookId
        )
      },
    }) > 0
  )
}

export function useApplyLocallyProgress(
  bookId: string,
): BehaviorSubject<ApplyLocallyProgress> | undefined {
  const progressStreams = useMutationState<
    BehaviorSubject<ApplyLocallyProgress> | undefined
  >({
    filters: {
      exact: true,
      mutationKey: getApplyLocallyMutationKey(),
      status: "pending",
    },
    select: function selectApplyLocallyProgress(mutation) {
      return isApplyLocallyMutation(mutation) &&
        mutation.state.variables.bookId === bookId
        ? mutation.state.variables.progress$
        : undefined
    },
  })

  return progressStreams.at(-1)
}

const saveDownloadedFile = async (bookId: string, file: File) => {
  await dexieDb.downloads.put({
    id: bookId,
    data: file,
    filename: file.name,
  })
}

export function useApplyLocally(options?: ApplyLocallyOptions) {
  const queryClient = useQueryClient()
  const { mutateAsync: applyLocalOptimizations } = useMutation({
    ...options,
    mutationKey: getApplyLocallyMutationKey(),
    mutationFn: async function applyLocalOptimizations({
      bookId,
      actions,
      progress$,
    }: ApplyLocalVariables) {
      const optimizesImages = actions.some(
        function isImageOptimizationAction(action) {
          return action.kind === "compress-images"
        },
      )

      progress$.next(
        optimizesImages
          ? { phase: "optimizing-images", progress: undefined }
          : { phase: "rebuilding-book-file" },
      )

      const cached = await getBookFile(bookId)

      if (!cached) {
        throw new Error(`Cannot optimize: no cached file for book ${bookId}`)
      }

      const file = cached.data
      const archive = await createArchiveFromZipJs(
        new ZipReader(new BlobReader(file)),
      )

      try {
        const { blob, mimeType, dispose } = await updateArchive(archive, {
          actions,
          sourceMimeType: file.type,
          onProgress: function reportArchiveUpdateProgress(progress) {
            if (progress.phase === "write-archive") {
              progress$.next({
                phase: "rebuilding-book-file",
              })

              return
            }

            progress$.next({
              phase: "optimizing-images",
              progress:
                progress.total > 0
                  ? progress.completed / progress.total
                  : undefined,
            })
          },
        })

        try {
          progress$.next({ phase: "saving-locally" })

          await saveDownloadedFile(
            bookId,
            new File([blob], file.name, { type: mimeType }),
          )
        } finally {
          await dispose()
        }
      } finally {
        await archive.close()
      }
    },
    onSuccess: async function finishApplyingLocalOptimizations(
      _data,
      { bookId, progress$ },
    ) {
      progress$.next({ phase: "refreshing-report" })

      await queryClient.invalidateQueries({
        queryKey: getFileInspectionQueryKey(bookId),
      })

      notify({
        title: "Book optimized",
        description:
          "Changes were saved to the downloaded file on this device.",
        severity: "success",
      })
    },
    onSettled: function completeApplyLocallyProgress(
      _data,
      _error,
      { progress$ },
    ) {
      progress$.complete()
    },
  })

  const applyLocally = useCallback(
    async function confirmAndApplyLocally({
      actions,
      bookId,
    }: ApplyLocallyInput): Promise<boolean> {
      Logger.info("[bookOptimize] local update actions", { bookId, actions })

      const isConfirmed = await confirmApplyLocalUpdate(actions)

      if (!isConfirmed) return false

      const progress$ = new BehaviorSubject<ApplyLocallyProgress>({
        phase: "preparing",
      })

      await applyLocalOptimizations({ actions, bookId, progress$ })

      return true
    },
    [applyLocalOptimizations],
  )

  return { applyLocally }
}
