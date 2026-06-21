import { useLocalSettings } from "../settings/useLocalSettings"
import { directives } from "@oboku/shared"

export const useCollectionDisplayTitle = (title?: string) => {
  const hideDirectivesFromCollectionName = useLocalSettings(
    "hideDirectivesFromCollectionName",
  )

  if (title === undefined) return title

  if (hideDirectivesFromCollectionName)
    return directives.removeDirectiveFromString(title ?? "")

  return title
}
