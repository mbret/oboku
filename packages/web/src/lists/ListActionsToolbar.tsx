import React, { ComponentProps, FC, useState } from "react"
import { Toolbar, IconButton, useTheme, Button } from "@material-ui/core"
import {
  AppsRounded,
  ListRounded,
  LockOpenRounded,
  SortRounded
} from "@material-ui/icons"
import { useRecoilValue } from "recoil"
import { libraryState } from "../library/states"
import { SortByDialog } from "../books/bookList/SortByDialog"

type Sorting = ComponentProps<typeof SortByDialog>["value"]

export const ListActionsToolbar: FC<{
  viewMode: "grid" | "list"
  sorting: Sorting
  onViewModeChange: (viewMode: "list" | "grid") => void
  onSortingChange: (sorting: Sorting) => void
}> = ({ viewMode, onViewModeChange, onSortingChange, sorting }) => {
  const theme = useTheme()
  const library = useRecoilValue(libraryState)
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)

  return (
    <>
      <Toolbar
        style={{
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            flexGrow: 1,
            justifyContent: "flex-start",
            flexFlow: "row",
            display: "flex",
            alignItems: "center"
          }}
        >
          <Button
            variant="text"
            color="secondary"
            onClick={() => setIsSortingDialogOpened(true)}
            startIcon={<SortRounded />}
          >
            {sorting === "activity"
              ? "Recent activity"
              : sorting === "alpha"
              ? "A > Z"
              : "Date added"}
          </Button>
        </div>
        {library?.isLibraryUnlocked && (
          <div
            style={{
              display: "flex",
              flexFlow: "row",
              alignItems: "center",
              marginLeft: theme.spacing(1),
              overflow: "hidden"
            }}
          >
            <LockOpenRounded fontSize="small" />
          </div>
        )}
        <IconButton
          onClick={() => {
            onViewModeChange(viewMode === "grid" ? "list" : "grid")
          }}
        >
          {viewMode === "grid" ? <AppsRounded /> : <ListRounded />}
        </IconButton>
      </Toolbar>
      <SortByDialog
        value={sorting}
        onClose={() => setIsSortingDialogOpened(false)}
        open={isSortingDialogOpened}
        onChange={onSortingChange}
      />
    </>
  )
}
