import { STREAMER_URL_PREFIX } from "../../constants.shared"

export const getManifestBaseUrl = (origin: string, epubFileName: string) => {
  return `${origin}/${STREAMER_URL_PREFIX}/${epubFileName}/`
}
