import { ErrorRounded } from "@mui/icons-material"
import { Tab, Tabs, styled } from "@mui/material"
import type { SyntheticEvent } from "react"
import { useFormState } from "react-hook-form"
import { useBookOptimize } from "./BookOptimizeProvider"
import type { BookOptimizeFormValues } from "./form"
import { BOOK_OPTIMIZE_TABS, type BookOptimizeTab } from "./tabs"

// MUI makes a tab with both an icon and a label 72px tall; the error marker must not move the page.
const FixedHeightTab = styled(Tab)({
  minHeight: 48,
})

const TAB_DEFINITIONS: Record<
  BookOptimizeTab,
  { label: string; fields: readonly (keyof BookOptimizeFormValues)[] }
> = {
  [BOOK_OPTIMIZE_TABS.METADATA]: { label: "Metadata", fields: ["identifiers"] },
  [BOOK_OPTIMIZE_TABS.CONTENT]: {
    label: "Content",
    fields: ["compressImages", "imageOutputMode", "maxWidth", "maxHeight"],
  },
}

type Props = {
  value: BookOptimizeTab
  onChange: (event: SyntheticEvent, value: BookOptimizeTab) => void
}

export function BookOptimizeTabs({ value, onChange }: Props) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control } = useBookOptimize()
  const { errors } = useFormState({ control })

  return (
    <Tabs value={value} indicatorColor="primary" onChange={onChange}>
      {Object.values(BOOK_OPTIMIZE_TABS).map(function renderTab(tab) {
        const { label, fields } = TAB_DEFINITIONS[tab]
        const hasFieldInError = fields.some(
          (name) => errors[name] !== undefined,
        )

        return (
          <FixedHeightTab
            key={tab}
            label={label}
            value={tab}
            icon={
              hasFieldInError ? (
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
