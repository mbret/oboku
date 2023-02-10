import { FC } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { useCreateRequestPopupDialog } from "../plugins/useCreateRequestPopupDialog"

export const AddDataSource: FC<{
  openWith: ObokuPlugin | undefined
  onClose: () => void
}> = ({ openWith, onClose }) => {
  const createRequestPopup = useCreateRequestPopupDialog()

  if (!openWith) return null

  return (
    <>
      {openWith.AddDataSource && (
        <openWith.AddDataSource
          requestPopup={createRequestPopup({ name: openWith.name })}
          onClose={onClose}
        />
      )}
    </>
  )
}
