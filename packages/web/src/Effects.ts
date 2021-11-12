import { useBooksActionEffects } from "./books/effects"
import { useDownloadsEffects } from "./download/effects"

export const Effects = () => {
  useBooksActionEffects()
  useDownloadsEffects()

  return null
}