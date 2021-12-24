import { FC } from "react"
import { ObokuDataSourcePlugin } from "./types"

export const AddDataSource: FC<{
  openWith: ObokuDataSourcePlugin | undefined,
  onClose: () => void
}> = ({ openWith, onClose }) => {

  if (!openWith) return null

  return (
    <>
      {openWith.AddDataSource && <openWith.AddDataSource onClose={onClose} />}
    </>
  )
}