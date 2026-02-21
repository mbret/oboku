import { useSignalValue } from "reactjrx"
import { localSettingsSignal } from "../settings/useLocalSettings"
import { directives } from "@oboku/shared"

export const useCollectionDisplayTitle = (title?: string) => {
  const hideDirectivesFromCollectionName = useSignalValue(
    localSettingsSignal,
    (state) => state.hideDirectivesFromCollectionName,
  )

  if (title === undefined) return title

  if (hideDirectivesFromCollectionName)
    return directives.removeDirectiveFromString(title ?? "")

  return title
}
