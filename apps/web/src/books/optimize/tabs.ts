import { ROUTES } from "../../navigation/routes"

export const BOOK_OPTIMIZE_TAB_PARAM = "tab"

export const BOOK_OPTIMIZE_TABS = {
  METADATA: "metadata",
  CONTENT: "content",
} as const

export type BookOptimizeTab =
  (typeof BOOK_OPTIMIZE_TABS)[keyof typeof BOOK_OPTIMIZE_TABS]

export const DEFAULT_BOOK_OPTIMIZE_TAB = BOOK_OPTIMIZE_TABS.METADATA

export const isBookOptimizeTab = (
  value: string | null,
): value is BookOptimizeTab =>
  value === BOOK_OPTIMIZE_TABS.METADATA || value === BOOK_OPTIMIZE_TABS.CONTENT

export const getBookOptimizeRoute = ({
  bookId,
  tab,
}: {
  bookId: string
  tab?: BookOptimizeTab
}) => {
  const path = ROUTES.BOOK_OPTIMIZE.replace(":id", bookId)

  if (!tab) return path

  const searchParams = new URLSearchParams({
    [BOOK_OPTIMIZE_TAB_PARAM]: tab,
  })

  return `${path}?${searchParams.toString()}`
}
