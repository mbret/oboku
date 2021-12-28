import { FC } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"

export const AddDataSource: FC<{
  openWith: ObokuPlugin | undefined,
  onClose: () => void
}> = ({ openWith, onClose }) => {

  if (!openWith) return null

  return (
    <>
      {openWith.AddDataSource && <openWith.AddDataSource onClose={onClose} />}
    </>
  )
}