import { plugins } from "../plugins/configure"
import { useMemo } from "react"

export const useDataSourceHelpers = (
  idOrObj:
    | (typeof plugins)[number]["uniqueResourceIdentifier"]
    | { uniqueResourceIdentifier: string },
) => {
  const id =
    typeof idOrObj === "string" ? idOrObj : idOrObj.uniqueResourceIdentifier

  return useMemo(
    () => ({
      generateResourceId: (resourceId: string) => `${id}-${resourceId}`,
      extractIdFromResourceId: (resourceId: string) =>
        resourceId.replace(`${id}-`, ``),
    }),
    [id],
  )
}

export const useDataSourcePlugin = (type?: string) =>
  useMemo(() => getDataSourcePlugin(type), [type])

export const getDataSourcePlugin = (type?: string) =>
  plugins.find((plugin) => plugin.type === type)
