import { useBooksActionEffects } from "./books/effects"
import { useDataSourceEffects } from "./dataSources/actions/effects"
import { useDownloadsEffects } from "./download/effects"
import { useTagEffects } from "./tags/effects"

export const Effects = () => {
  useBooksActionEffects()
  useDownloadsEffects()
  useDataSourceEffects()
  useTagEffects()

  return null
}
