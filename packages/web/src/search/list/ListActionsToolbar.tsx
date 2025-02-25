import { useSignalValue } from "reactjrx"
import { ListActionsToolbar as CommonListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { FiltersDrawer } from "./FiltersDrawer"
import { type ComponentProps, useState } from "react"
import { searchListActionsToolbarSignal } from "./states"

export const ListActionsToolbar = ({
  ...rest
}: ComponentProps<typeof CommonListActionsToolbar>) => {
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false)
  const searchListActionsToolbar = useSignalValue(
    searchListActionsToolbarSignal,
  )
  const numberOfFiltersApplied =
    searchListActionsToolbar.notInterestedContents !== "none" ? 1 : 0

  return (
    <>
      <CommonListActionsToolbar
        onFilterClick={() => {
          setIsFiltersDrawerOpen(true)
        }}
        numberOfFiltersApplied={numberOfFiltersApplied}
        {...rest}
      />
      <FiltersDrawer
        onClose={() => {
          setIsFiltersDrawerOpen(false)
        }}
        open={isFiltersDrawerOpen}
      />
    </>
  )
}
