import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"

export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`${UNIQUE_RESOURCE_IDENTIFIER}-`, ``)
