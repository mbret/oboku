import { memo, useEffect } from "react"
import { useLocation } from "react-router"
import {
  hasOpenedReaderAlreadyStateSignal,
  bookBeingReadStateSignal,
} from "./states"
import { SIGNAL_RESET, useSwitchMutation$ } from "reactjrx"
import { getMetadataFromBook } from "../books/metadata"
import { useCreateBackToBookDialog } from "./useCreateBackToBookDialog"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import { ReadingStateState } from "@oboku/shared"
import { CancelError } from "../errors/errors.shared"
import { catchCancelError } from "../errors/catchCancelError"
import { ROUTES } from "../navigation/routes"

const BASE_READER_ROUTE = ROUTES.READER.replace(`/:id`, ``)

export const BackToReadingDialog = memo(
  ({ isProfileHydrated }: { isProfileHydrated: boolean }) => {
    const location = useLocation()
    const isWithinReaderRoute = location.pathname.startsWith(BASE_READER_ROUTE)
    const { mutateAsync: createBackToBookDialog } = useCreateBackToBookDialog()

    const { mutate: checkBackToReading } = useSwitchMutation$({
      mutationFn: () => {
        const bookBeingReadId = bookBeingReadStateSignal.getValue()

        if (
          !bookBeingReadId ||
          hasOpenedReaderAlreadyStateSignal.getValue() ||
          isWithinReaderRoute
        )
          throw new CancelError()

        return latestDatabase$.pipe(
          switchMap((db) => {
            const book$ = from(db.book.findOne(bookBeingReadId).exec())

            return book$.pipe(
              switchMap((book) => {
                if (
                  !book ||
                  book.readingStateCurrentState === ReadingStateState.Finished
                )
                  throw new CancelError()

                const { title } = getMetadataFromBook(book.toJSON())

                return from(
                  createBackToBookDialog({
                    bookId: bookBeingReadId,
                    title: title?.toString() ?? "",
                  }),
                )
              }),
            )
          }),
          catchCancelError((err) => {
            // It's important to only reset the book id when the user cancel the current dialog
            // otherwise we can conflict with the signal being set somewhere else in the app.
            // If the user press OK, we don't want to reset since he is going to the reader.
            // The reset might happens after the signal is set from the reader (creating a conflict).
            bookBeingReadStateSignal.setValue(SIGNAL_RESET)

            throw err
          }),
        )
      },
    })

    /**
     * We make sure to only trigger the check once and on mount
     */
    useEffect(() => {
      if (isProfileHydrated) {
        checkBackToReading()
      }
    }, [isProfileHydrated, checkBackToReading])

    return null
  },
)
