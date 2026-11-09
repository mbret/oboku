import type { SettingsCatalogDocType } from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { useDatabase } from "../../rxdb"

const withCatalogEnabled = (
  catalogs: SettingsCatalogDocType[] | undefined,
  id: string,
  isEnabled: boolean,
): SettingsCatalogDocType[] => {
  const hasEntry = catalogs?.some((catalog) => catalog.id === id)

  return hasEntry
    ? (catalogs ?? []).map((catalog) =>
        catalog.id === id ? { ...catalog, isEnabled } : catalog,
      )
    : [...(catalogs ?? []), { id, isEnabled }]
}

export const useSetCatalogEnabled = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({
      id,
      isEnabled,
    }: {
      id: string
      isEnabled: boolean
    }) => {
      const settings = await db?.settings.findOne("settings").exec()

      return settings?.incrementalModify((doc) => ({
        ...doc,
        catalogs: withCatalogEnabled(doc.catalogs, id, isEnabled),
      }))
    },
  })
}
