import { READER_ACCEPTED_EXTENSIONS } from "@oboku/shared"
import { memo } from "react"
import type { ObokuPlugin } from "../types"
import { Picker } from "./picker"

export const UploadBook: ObokuPlugin<"one-drive">["UploadBookComponent"] = memo(
  function UploadBook({ onClose }) {
    return (
      <Picker
        fileFilters={READER_ACCEPTED_EXTENSIONS}
        onClose={(selections) =>
          onClose(
            selections?.map((item) => ({
              book: {
                metadata: [{ type: "link", title: item.name }],
              },
              link: {
                data: {
                  driveId: item.parentReference.driveId,
                  fileId: item.id,
                },
                type: "one-drive",
              },
            })),
          )
        }
      />
    )
  },
)
