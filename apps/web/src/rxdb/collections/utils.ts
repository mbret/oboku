import { parseLegacyResourceIdForMigration } from "@oboku/shared"

export const generateId = () => crypto.randomUUID()

/**
 * Merges the identity fields of a legacy `resourceId` into the existing data
 * of a link. Data that is not a plain object is replaced.
 */
export function migrateResourceIdToData(
  type: string,
  resourceId: string | undefined,
  existingData: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const isExistingDataAnObject =
    existingData !== null &&
    typeof existingData === "object" &&
    !Array.isArray(existingData)
  const base = isExistingDataAnObject ? existingData : {}

  if (!resourceId) return base

  return { ...base, ...parseLegacyResourceIdForMigration(type, resourceId) }
}
