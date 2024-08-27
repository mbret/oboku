import { ListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { FiltersDrawer } from "./filters/FiltersDrawer"
import { ComponentProps, useCallback, useState } from "react"

export const Toolbar = ({
  ...rest
}: ComponentProps<typeof ListActionsToolbar>) => {
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
        {...rest}
      />
      <FiltersDrawer
        onClose={onFiltersDrawerClose}
        open={isFiltersDrawerOpen}
      />
    </>
  )
}
