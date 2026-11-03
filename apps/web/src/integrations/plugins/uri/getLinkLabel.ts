import type { GetLinkLabel } from "../types"

export const getLinkLabel: GetLinkLabel<"URI"> = function getUriLinkLabel({
  url,
}) {
  return url ? url.substring(url.lastIndexOf("/") + 1) || url : undefined
}
