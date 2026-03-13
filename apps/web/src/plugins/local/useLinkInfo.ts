import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ enabled }) => {
  return {
    data: {
      label: enabled ? "Local file" : undefined,
    },
  }
}
