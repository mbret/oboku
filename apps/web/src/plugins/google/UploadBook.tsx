import { useDrivePicker } from "./lib/useDrivePicker"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./lib/constants"
import { map, switchMap, timer } from "rxjs"
import { useMount } from "react-use"
import type { ObokuPlugin, UploadBookToAddPayload } from "../types"
import { memo } from "react"
import { useSwitchMutation$ } from "reactjrx"

export const UploadBook: ObokuPlugin["UploadBookComponent"] = memo(
  ({ onClose, requestPopup }) => {
    const { generateResourceId } = useDataSourceHelpers(
      UNIQUE_RESOURCE_IDENTIFIER,
    )
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
            const payloads: UploadBookToAddPayload[] = docs.map((doc) => ({
              book: {
                metadata: [{ type: "link", title: doc.name }],
              },
              link: {
                resourceId: generateResourceId(doc.id),
                type: `DRIVE`,
              },
            }))

            return payloads
          }),
        ),
      onSuccess: (data) => {
        onClose(data ?? [])
      },
      onError: (error) => {
        console.error(error)

        onClose()
      },
    })

    useMount(() => {
      mutate()
    })

    return null
  },
)
