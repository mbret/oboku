import { useSettings } from "../../../settings/helpers"

export const useConnector = (id?: string) => {
  const { data: settings, ...rest } = useSettings()

  return {
    ...rest,
    data: id ? settings?.webdavConnectors?.find((connector) => connector.id === id) : undefined,
  }
}
