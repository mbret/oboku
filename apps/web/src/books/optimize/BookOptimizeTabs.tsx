import { ErrorRounded } from "@mui/icons-material"
import { Tab, Tabs, styled } from "@mui/material"
import { useFormState } from "react-hook-form"
import { useBookOptimize } from "./BookOptimizeProvider"
import type { BookOptimizeFormValues } from "./form"
import { BOOK_OPTIMIZE_TABS, type BookOptimizeTab } from "./tabs"
import { useBookOptimizeTab } from "./useBookOptimizeTab"

// MUI raises a tab with an icon and a label from 48px to 72px. Keep 48px so the error icon does not move the page.
const FixedHeightTab = styled(Tab)({
  minHeight: 48,
})

const TAB_LABELS: Record<BookOptimizeTab, string> = {
  [BOOK_OPTIMIZE_TABS.METADATA]: "Metadata",
  [BOOK_OPTIMIZE_TABS.CONTENT]: "Content",
}

const TAB_OF_FIELD: Record<keyof BookOptimizeFormValues, BookOptimizeTab> = {
  identifiers: BOOK_OPTIMIZE_TABS.METADATA,
  compressImages: BOOK_OPTIMIZE_TABS.CONTENT,
  imageOutputMode: BOOK_OPTIMIZE_TABS.CONTENT,
  maxWidth: BOOK_OPTIMIZE_TABS.CONTENT,
  maxHeight: BOOK_OPTIMIZE_TABS.CONTENT,
}

const isBookOptimizeField = (
  name: string,
): name is keyof BookOptimizeFormValues => Object.hasOwn(TAB_OF_FIELD, name)

export function BookOptimizeTabs() {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control } = useBookOptimize()
  const { errors } = useFormState({ control })
  const { tab: selectedTab, selectTab } = useBookOptimizeTab()
  const tabsWithFieldInError = new Set(
    Object.keys(errors)
      .filter(isBookOptimizeField)
      .filter((field) => errors[field] !== undefined)
      .map((field) => TAB_OF_FIELD[field]),
  )

  return (
    <Tabs
      value={selectedTab}
      indicatorColor="primary"
      onChange={function selectClickedTab(_event, nextTab: BookOptimizeTab) {
        selectTab(nextTab)
      }}
    >
      {Object.values(BOOK_OPTIMIZE_TABS).map(function renderTab(tab) {
        return (
          <FixedHeightTab
            key={tab}
            label={TAB_LABELS[tab]}
            value={tab}
            icon={
              tabsWithFieldInError.has(tab) ? (
                <ErrorRounded color="error" titleAccess="Has errors" />
              ) : undefined
            }
            iconPosition="end"
          />
        )
      })}
    </Tabs>
  )
}
