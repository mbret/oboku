import { LinkDocType } from "@oboku/shared"
import { plugins } from "../dataSources"

export const isRemovableFromDataSource = ({
  link
}: {
  link?: LinkDocType | null
}) => {
  if (!link) return undefined

  const linkPlugin = plugins.find((plugin) => plugin.type === link.type)

  return !!linkPlugin?.useRemoveBook
}
