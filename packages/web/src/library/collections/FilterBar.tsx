import { ListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { FiltersDrawer } from "./FiltersDrawer"
import { useCallback, useState } from "react"

export const FilterBar = () => {
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false)

  const onFiltersDrawerClose = useCallback(() => {
    setIsFiltersDrawerOpen(false)
  }, [setIsFiltersDrawerOpen])

  return (
    <>
      <ListActionsToolbar
        onFilterClick={() => {
          setIsFiltersDrawerOpen(true)
        }}
      />
      <FiltersDrawer
        onClose={onFiltersDrawerClose}
        open={isFiltersDrawerOpen}
      />
    </>
  )
}
