import { useDrivePicker } from "./lib/useDrivePicker"
import { useAddBook } from "../../books/helpers"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./lib/constants"
import { catchError, from, map, of, switchMap, timer } from "rxjs"
import { useMount } from "react-use"
import type { ObokuPlugin } from "../types"
import { memo } from "react"
import { useSwitchMutation$ } from "reactjrx"

export const UploadBook: ObokuPlugin["UploadBookComponent"] = memo(
  ({ onClose, requestPopup }) => {
    const [addBook] = useAddBook()
    const { generateResourceId } = useDataSourceHelpers(
      UNIQUE_RESOURCE_IDENTIFIER,
    )
    const { pick } = useDrivePicker({ requestPopup })

    const { mutate } = useSwitchMutation$({
      /**
       * timer prevent double mount from dev mode
       */
      mutationFn: () =>
        timer(1).pipe(
          switchMap(() => pick({ select: "file" })),
          switchMap((data) => {
            onClose()

            if (data.action !== "picked") return of(null)

            const docs = data?.docs || []

            return from(
              Promise.all(
                docs.map(async (doc) => {
                  return addBook({
                    book: {
                      metadata: [
                        {
                          type: "link",
                          title: doc.name,
                        },
                      ],
                    },
                    link: {
                      book: null,
                      data: null,
                      resourceId: generateResourceId(doc.id),
                      type: `DRIVE`,
                      createdAt: new Date().toISOString(),
                      modifiedAt: null,
                    },
                  })
                }),
              ),
            )
          }),
          map(() => null),
          catchError((error) => {
            onClose()

            throw error
          }),
        ),
    })

    useMount(() => {
      console.log("FOOO mount")
      mutate()
    })

    return null
  },
)
