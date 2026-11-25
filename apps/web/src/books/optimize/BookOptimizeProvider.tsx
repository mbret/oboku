import { useEffect, useMemo, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import type { FileInspection } from "./useFileInspection"
import { useUploadToSource } from "./actions/useUploadToSource"
import { useRevertLocalChanges } from "./actions/useRevertLocalChanges"
import {
  BookOptimizeContext,
  type BookOptimizeContextValue,
} from "./BookOptimizeContext"
import {
  resolveBookOptimizeFormValues,
  type BookOptimizeFormValues,
} from "./form"

export { useBookOptimize } from "./BookOptimizeContext"

type Props = {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
  canUploadToSource: boolean
  inspection: FileInspection
  children: ReactNode
}

export function BookOptimizeProvider({
  book,
  link,
  canUploadToSource,
  inspection,
  children,
}: Props) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const bookId = book._id

  const { revertLocalChanges, isReverting, canRevert } = useRevertLocalChanges({
    book,
    link,
  })

  const {
    control,
    reset,
    trigger,
    getValues,
    formState: { isValid, isDirty },
  } = useForm<BookOptimizeFormValues>({
    defaultValues: resolveBookOptimizeFormValues(inspection),
    mode: "onChange",
  })

  useEffect(
    function showErrorsOfSeededValues() {
      void trigger()
    },
    [trigger],
  )

  // Upload pushes the current local file as-is; pending (un-applied) edits must
  // be applied locally first so the remote matches what the form describes.
  const { uploadToSource, isUploading, canUpload, slot, uploadProgress$ } =
    useUploadToSource({
      book,
      link,
      enabled: canUploadToSource && !isDirty,
    })

  const value = useMemo<BookOptimizeContextValue>(
    () => ({
      bookId,
      control,
      getValues,
      inspection,
      isDirty,
      isUploading,
      isValid,
      reset,
      trigger,
      canUpload,
      uploadToSource,
      revertLocalChanges,
      canRevert,
      isReverting,
      uploadProgress$,
    }),
    [
      bookId,
      control,
      getValues,
      inspection,
      isDirty,
      isUploading,
      isValid,
      reset,
      trigger,
      canUpload,
      uploadToSource,
      revertLocalChanges,
      canRevert,
      isReverting,
      uploadProgress$,
    ],
  )

  return (
    <BookOptimizeContext.Provider value={value}>
      {slot}
      {children}
    </BookOptimizeContext.Provider>
  )
}
