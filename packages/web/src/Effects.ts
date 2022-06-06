import { useBooksActionEffects } from "./books/effects"
import { useDataSourceEffects } from "./dataSources/actions/effects"
import { useDownloadsEffects } from "./download/effects"

export const Effects = () => {
  useBooksActionEffects()
  useDownloadsEffects()
  useDataSourceEffects()

  return null
}
