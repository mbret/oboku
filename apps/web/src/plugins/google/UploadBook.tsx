import { useDrivePicker } from "./lib/useDrivePicker"
import { map, switchMap, timer } from "rxjs"
import type { ObokuPlugin, UploadBookToAddPayload } from "../types"
import { memo, useEffect } from "react"
import { SwitchMutationCancelError, useSwitchMutation$ } from "reactjrx"
import { Logger } from "../../debug/logger.shared"
import { CancelError } from "../../errors/errors.shared"

export const UploadBook: ObokuPlugin<"DRIVE">["UploadBookComponent"] = memo(
  ({ onClose, requestPopup }) => {
    const { pick } = useDrivePicker({ requestPopup })

    const { mutate } = useSwitchMutation$({
      mutationFn: () =>
        timer(1).pipe(
          switchMap(() => pick({ select: "file", multiSelect: true })),
          map((data) => {
            if (data.action !== google.picker.Action.PICKED) {
              return []
            }

            const docs = data?.docs || []
            const payloads: UploadBookToAddPayload<"DRIVE">[] = docs.map(
              (doc) => ({
                book: {
                  metadata: [{ type: "link", title: doc.name }],
                },
                link: {
                  data: { fileId: doc.id },
                  type: `DRIVE`,
                },
              }),
            )

            return payloads
          }),
        ),
      onSuccess: (data) => {
        onClose(data ?? [])
      },
      onError: (error) => {
        if (error instanceof SwitchMutationCancelError) {
          return
        }

        if (!(error instanceof CancelError)) {
          Logger.error(error)
        }

        onClose()
      },
    })

    useEffect(() => {
      mutate()
    }, [mutate])

    return null
  },
)
