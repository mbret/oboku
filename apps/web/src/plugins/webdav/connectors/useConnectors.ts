import { useSettings } from "../../../settings/helpers"

export const useConnectors = () => {
  const { data: settings } = useSettings()

  return {
    data: settings?.webdavConnectors,
  }
}
