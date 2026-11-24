import type { LinkDocType } from "@oboku/shared"
import { plugins } from "../librarySyncs"

export const isRemovableFromSource = ({
  link,
}: {
  link?: LinkDocType | null
}) => {
  if (!link) return undefined

  const linkPlugin = plugins.find((plugin) => plugin.type === link.type)

  return !!linkPlugin?.canRemoveResource
}
