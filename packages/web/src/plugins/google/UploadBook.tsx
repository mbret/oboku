import { FC } from "react"
import { Report } from "../../debug/report.shared"
import { useDrivePicker } from "./lib/useDrivePicker"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { useAddBook } from "../../books/helpers"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./lib/constants"
import { catchError, EMPTY, from, of, switchMap, takeUntil } from "rxjs"
import { useIsMountedState$ } from "../../common/rxjs/useIsMountedState$"
import { useMount } from "react-use"

export const UploadBook: FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const [addBook] = useAddBook()
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER
  )
  const { pick } = useDrivePicker()
  const { unMount$ } = useIsMountedState$()

  useMount(() => {
    pick({ select: "file" })
      .pipe(
        switchMap((data) => {
          onClose()

          if (data.action !== "picked") return of(EMPTY)

          const docs = data?.docs || []

          return from(
            Promise.all(
              docs.map(async (doc) => {
                return addBook({
                  book: {
                    title: doc.name
                  },
                  link: {
                    book: null,
                    data: null,
                    resourceId: generateResourceId(doc.id),
                    type: `DRIVE`,
                    createdAt: new Date().toISOString(),
                    modifiedAt: null
                  }
                }).catch(Report.error)
              })
            )
          )
        }),
        catchError((error) => {
          console.error(error)
          onClose()

          return EMPTY
        }),
        takeUntil(unMount$)
      )
      .subscribe()
  })

  return (
    <>
      <BlockingScreen />
    </>
  )
}