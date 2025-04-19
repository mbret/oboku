import type { UseLinkInfo } from "../types"
import { extractIdFromResourceId } from "./helpers"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
    const id = enabled && resourceId ? extractIdFromResourceId(resourceId) : undefined

    return {
        data: {
            label: `ID: ${id}`
        }
    }
}