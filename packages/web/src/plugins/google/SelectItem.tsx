import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./lib/constants"
import { useDrivePicker } from "./lib/useDrivePicker"
import { useIsMountedState$ } from "../../common/rxjs/useIsMountedState$"
import { catchError, EMPTY, takeUntil, tap } from "rxjs"
import { useEffect } from "react"
import { ObokuPlugin } from "../plugin-front"

export const SelectItem: ObokuPlugin[`SelectItemComponent`] = ({
  onClose,
  open,
  requestPopup
}) => {
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER
  )
  const { pick } = useDrivePicker({ requestPopup })
  const { unMount$ } = useIsMountedState$()

  useEffect(() => {
    if (!open) return

    const stream$ = pick({ select: "file" })
      .pipe(
        tap((data) => {
          if (data.action !== google.picker.Action.PICKED) {
            return onClose({
              code: `unknown`
            })
          }

          const [doc] = data?.docs || []

          if (!doc) {
            onClose({
              code: `unknown`
            })
          } else {
            onClose(undefined, {
              resourceId: generateResourceId(doc.id)
            })
          }
        }),
        catchError((error) => {
          onClose({ code: `unknown`, originalError: error })

          return EMPTY
        }),
        takeUntil(unMount$)
      )
      .subscribe()

    return () => {
      stream$.unsubscribe()
    }
  }, [open, pick])

  if (!open) return null

  return null
}
