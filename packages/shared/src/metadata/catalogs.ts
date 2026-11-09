import type { SettingsCatalogDocType } from "../db/docTypes"

/** Whether a metadata refresh asks the catalog, for the account's settings. */
export const isCatalogEnabled = (
  catalogs: ReadonlyArray<Readonly<SettingsCatalogDocType>> | undefined,
  catalogId: string,
): boolean => catalogs?.find(({ id }) => id === catalogId)?.isEnabled !== false
