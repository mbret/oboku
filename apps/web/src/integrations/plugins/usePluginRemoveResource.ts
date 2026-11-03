import type { DataSourceType, LinkDocType } from "@oboku/shared"
import { getPluginByType } from "./configure"
import type { RemoveResourceResult } from "./types"
import { useMutation } from "@tanstack/react-query"

export type RemoveResourceGroup = {
  type: LinkDocType["type"]
  links: readonly LinkDocType[]
}

export type RemoveResourceGroupHandler = (
  group: RemoveResourceGroup,
) => Promise<RemoveResourceResult<LinkDocType["type"]>>

const isLinkOfType =
  <T extends LinkDocType["type"]>(type: T) =>
  (link: LinkDocType): link is Extract<LinkDocType, { type: T }> =>
    link.type === type

function removeResourcesOfType<T extends DataSourceType>(
  type: T,
  links: readonly LinkDocType[],
) {
  return getPluginByType(type).removeResource(links.filter(isLinkOfType(type)))
}

export const usePluginRemoveResource = () => {
  return useMutation({
    mutationFn: async function removeResourceGroup(group: RemoveResourceGroup) {
      return removeResourcesOfType(group.type, group.links)
    },
  })
}
