import type { GetLinkLabel } from "../types"

export const getLinkLabel: GetLinkLabel<"file"> = function getLocalLinkLabel() {
  return "Local file"
}
