import { FC } from "react"
import { useCreateRequestPopupDialog } from "../plugins/useCreateRequestPopupDialog"
import { ObokuPlugin } from "../plugins/plugin-front"

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
