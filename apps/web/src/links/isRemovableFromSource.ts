import type { LinkDocType } from "@oboku/shared"
import { plugins } from "../integrations/plugins/configure"

export const isRemovableFromSource = ({
  link,
}: {
  link?: LinkDocType | null
}) => {
  if (!link) return undefined

  const linkPlugin = plugins.find((plugin) => plugin.type === link.type)

  return !!linkPlugin?.canRemoveResource
}
