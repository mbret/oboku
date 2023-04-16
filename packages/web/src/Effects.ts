import { useBooksActionEffects } from "./books/effects"
import { effects as datasourceEffects } from "./dataSources/effects"
import { useDownloadsEffects } from "./download/effects"
import { useTagEffects } from "./tags/effects"

const effects = [
  ...datasourceEffects,
  useTagEffects,
  useDownloadsEffects,
  useBooksActionEffects
]

export const Effects = () => {
  effects.forEach((effectHook) => effectHook())

  return null
}
