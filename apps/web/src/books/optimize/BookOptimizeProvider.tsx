import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import { useForm, type Control } from "react-hook-form"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import type { Observable } from "rxjs"
import { CancelError } from "../../errors/errors.shared"
import { notify, notifyError } from "../../notifications/toasts"
import type { FileInspection } from "./useFileInspection"
import { useApplyLocalOptimizations } from "./apply/useApplyLocalOptimizations"
import { useUploadToDataSource } from "./actions/useUploadToDataSource"
import { useRevertLocalChanges } from "./actions/useRevertLocalChanges"
import {
  EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
  resolveBookOptimizeFormValues,
  type BookOptimizeFormValues,
} from "./form"
import { buildOptimizeOperations } from "./apply/buildOptimizeOperations"

type BookOptimizeContextValue = {
  control: Control<BookOptimizeFormValues>
  inspection: FileInspection
  isApplyingLocally: boolean
  isUploading: boolean
  canApplyLocally: boolean
  canUpload: boolean
  applyLocally: () => void
  uploadToDataSource: () => Promise<void>
  revertLocalChanges: () => Promise<void>
  canRevert: boolean
  isReverting: boolean
  uploadProgress$: Observable<number> | undefined
  compressionProgress$: Observable<number>
}

const BookOptimizeContext = createContext<BookOptimizeContextValue | null>(null)

type Props = {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
  canUploadToDataSource: boolean
  inspection: FileInspection
  children: ReactNode
}

export function BookOptimizeProvider({
  book,
  link,
  canUploadToDataSource,
  inspection,
  children,
}: Props) {
  const bookId = book._id

  const { revertLocalChanges, isReverting, canRevert } = useRevertLocalChanges({
    book,
    link,
  })

  const {
    control,
    reset,
    getValues,
    formState: { isValid, isDirty },
  } = useForm<BookOptimizeFormValues>({
    defaultValues: EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
    mode: "onChange",
  })

  const resolvedValues = useMemo(
    () => resolveBookOptimizeFormValues(inspection),
    [inspection],
  )

  const formKey = `${book._id}:${link._id}`
  const seededFormKeyRef = useRef<string | null>(null)

  useEffect(
    function seedFormPerBookLink() {
      if (seededFormKeyRef.current === formKey) return

      seededFormKeyRef.current = formKey
      reset(resolvedValues)
    },
    [formKey, reset, resolvedValues],
  )

  const {
    mutate: applyLocalOptimizations,
    isPending: isApplyingLocally,
    compressionProgress$,
  } = useApplyLocalOptimizations()

  // Upload pushes the current local file as-is; pending (un-applied) edits must
  // be applied locally first so the remote matches what the form describes.
  const { uploadToDataSource, isUploading, canUpload, slot, uploadProgress$ } =
    useUploadToDataSource({
      book,
      link,
      enabled: canUploadToDataSource && !isDirty && !isApplyingLocally,
    })

  const isBusy = isApplyingLocally || isUploading

  // A pending, valid change is enough to apply. Both gates key off the same
  // `isDirty` signal so a dirty-but-no-op edit can never leave the user stuck
  // (unable to apply and unable to upload).
  const canApplyLocally = isValid && isDirty && !isBusy

  const applyLocally = useCallback(() => {
    if (!canApplyLocally) return

    applyLocalOptimizations(
      { bookId, operations: buildOptimizeOperations(getValues(), inspection) },
      {
        onSuccess: () => {
          reset(getValues())
          notify({
            title: "Book optimized",
            description:
              "Changes were saved to the downloaded file on this device.",
            severity: "success",
          })
        },
        onError: (error) => {
          if (error instanceof CancelError) return
          notifyError(error)
        },
      },
    )
  }, [
    applyLocalOptimizations,
    bookId,
    canApplyLocally,
    getValues,
    inspection,
    reset,
  ])

  const value = useMemo<BookOptimizeContextValue>(
    () => ({
      control,
      inspection,
      isApplyingLocally,
      isUploading,
      canApplyLocally,
      canUpload,
      applyLocally,
      uploadToDataSource,
      revertLocalChanges,
      canRevert,
      isReverting,
      uploadProgress$,
      compressionProgress$,
    }),
    [
      control,
      inspection,
      isApplyingLocally,
      isUploading,
      canApplyLocally,
      canUpload,
      applyLocally,
      uploadToDataSource,
      revertLocalChanges,
      canRevert,
      isReverting,
      uploadProgress$,
      compressionProgress$,
    ],
  )

  return (
    <BookOptimizeContext.Provider value={value}>
      {slot}
      {children}
    </BookOptimizeContext.Provider>
  )
}

export const useBookOptimize = (): BookOptimizeContextValue => {
  const context = useContext(BookOptimizeContext)

  if (!context) {
    throw new Error(
      "useBookOptimize must be used within a BookOptimizeProvider",
    )
  }

  return context
}
