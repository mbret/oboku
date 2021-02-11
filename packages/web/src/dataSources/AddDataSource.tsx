import { FC } from "react"
import { useDataSourcePlugins } from "./helpers"

export const AddDataSource: FC<{
  openWith: ReturnType<typeof useDataSourcePlugins>[number] | undefined,
  onClose: () => void
}> = ({ openWith, onClose }) => {

  if (!openWith) return null

  return (
    <openWith.AddDataSource onClose={onClose} />
  )
}