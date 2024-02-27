import { useSignalValue } from "reactjrx"
import { ListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { FiltersDrawer } from "./FiltersDrawer"
import { useCallback, useState } from "react"
import { collectionsListSignal } from "./state"

export const FilterBar = () => {
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false)
  const viewMode = useSignalValue(
    collectionsListSignal,
    (state) => state.viewMode
  )

  const onFiltersDrawerClose = useCallback(() => {
    setIsFiltersDrawerOpen(false)
  }, [setIsFiltersDrawerOpen])

  return (
    <>
      <ListActionsToolbar
        onFilterClick={() => {
          setIsFiltersDrawerOpen(true)
        }}
        onViewModeChange={(value) => {
          collectionsListSignal.setValue((state) => ({
            ...state,
            viewMode: value
          }))
        }}
        viewMode={viewMode}
      />
      <FiltersDrawer
        onClose={onFiltersDrawerClose}
        open={isFiltersDrawerOpen}
      />
    </>
  )
}
