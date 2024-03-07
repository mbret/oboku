import { STREAMER_URL_PREFIX } from "../../constants.shared"
import { getEpubNameFromUrl } from "./getEpubNameFromUrl.shared"

export const getResourcePathFromUrl = (url: string) => {
  const urlObj = new URL(url)
  const epubFileName = getEpubNameFromUrl(url)

  return decodeURIComponent(
    urlObj.pathname.replace(`/${STREAMER_URL_PREFIX}/${epubFileName}/`, ``)
  )
}
