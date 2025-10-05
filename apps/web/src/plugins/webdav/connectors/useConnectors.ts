import { useSettings } from "../../../settings/useSettings"

export const useConnectors = () => {
  const { data: settings } = useSettings()

  return {
    data: settings?.webdavConnectors,
  }
}
