import { createContext, useContext } from "react"
import type { Control, UseFormGetValues, UseFormReset } from "react-hook-form"
import type { Observable } from "rxjs"
import type { BookOptimizeFormValues } from "./form"
import type { FileInspection } from "./useFileInspection"

export type BookOptimizeContextValue = {
  bookId: string
  control: Control<BookOptimizeFormValues>
  getValues: UseFormGetValues<BookOptimizeFormValues>
  inspection: FileInspection
  isDirty: boolean
  isUploading: boolean
  isValid: boolean
  reset: UseFormReset<BookOptimizeFormValues>
  canUpload: boolean
  uploadToDataSource: () => Promise<void>
  revertLocalChanges: () => Promise<void>
  canRevert: boolean
  isReverting: boolean
  uploadProgress$: Observable<number> | undefined
}

export const BookOptimizeContext =
  createContext<BookOptimizeContextValue | null>(null)

export function useBookOptimize(): BookOptimizeContextValue {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const context = useContext(BookOptimizeContext)

  if (!context) {
    throw new Error(
      "useBookOptimize must be used within a BookOptimizeProvider",
    )
  }

  return context
}
