import { migrateResourceIdToData as extractLegacyResourceIdData } from "@oboku/shared"

export const generateId = () => crypto.randomUUID()

/**
 * Parses a legacy resourceId string and returns the identity fields to merge
 * into a data object for the given provider type.
 */
export function migrateResourceIdToData(
  type: string,
  resourceId: string | undefined,
  existingData: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const base =
    existingData !== null &&
    typeof existingData === "object" &&
    !Array.isArray(existingData)
      ? existingData
      : {}

  if (!resourceId) return base

  return extractLegacyResourceIdData(type, resourceId, base) ?? base
}
