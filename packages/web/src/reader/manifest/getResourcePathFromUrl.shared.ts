import { STREAMER_URL_PREFIX } from "../../constants.shared"

const getEpubNameFromUrl = (url: string) => {
  const { pathname } = new URL(url)
  const urlWithoutPrefix = pathname.substring(`/${STREAMER_URL_PREFIX}/`.length)
  const nextSlashIndex = urlWithoutPrefix.indexOf("/")

  if (nextSlashIndex !== -1) {
    return urlWithoutPrefix.substring(0, urlWithoutPrefix.indexOf("/"))
  }

  return urlWithoutPrefix
}

export const getResourcePathFromUrl = (url: string) => {
  const urlObj = new URL(url)
  const epubFileName = getEpubNameFromUrl(url)

  return decodeURIComponent(
    urlObj.pathname.replace(`/${STREAMER_URL_PREFIX}/${epubFileName}/`, ``),
  )
}
