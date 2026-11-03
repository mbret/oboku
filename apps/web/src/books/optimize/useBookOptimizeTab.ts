import { useSearchParams } from "react-router"
import {
  BOOK_OPTIMIZE_TAB_PARAM,
  type BookOptimizeTab,
  DEFAULT_BOOK_OPTIMIZE_TAB,
  isBookOptimizeTab,
} from "./tabs"

/** The optimize tab the URL selects, and a way to select another one. */
export const useBookOptimizeTab = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get(BOOK_OPTIMIZE_TAB_PARAM)
  const tab = isBookOptimizeTab(tabParam) ? tabParam : DEFAULT_BOOK_OPTIMIZE_TAB

  const selectTab = (nextTab: BookOptimizeTab) => {
    setSearchParams(
      function withSelectedTab(currentSearchParams) {
        const nextSearchParams = new URLSearchParams(currentSearchParams)
        nextSearchParams.set(BOOK_OPTIMIZE_TAB_PARAM, nextTab)

        return nextSearchParams
      },
      { replace: true },
    )
  }

  return { tab, selectTab }
}
