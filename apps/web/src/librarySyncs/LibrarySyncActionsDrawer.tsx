import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton,
} from "@mui/material"
import { memo } from "react"
import {
  SyncRounded,
  DeleteForeverRounded,
  InfoOutlineRounded,
} from "@mui/icons-material"
import { useLibrarySync } from "./useLibrarySync"
import { useSignalValue } from "reactjrx"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../library/books/states"
import { useRemoveLibrarySync } from "./useRemoveLibrarySync"
import { useLibrarySyncIncrementalModify } from "./useLibrarySyncIncrementalModify"
import { useSynchronizeLibrarySync } from "./useSynchronizeLibrarySync"
import { generatePath, Link } from "react-router"
import { ROUTES } from "../navigation/routes"
import { Checkbox } from "../common/Checkbox"

export const LibrarySyncActionsDrawer = memo(function LibrarySyncActionsDrawer({
  openWith,
  onClose,
}: {
  openWith?: string
  onClose: () => void
}) {
  const { mutate: syncLibrarySync } = useSynchronizeLibrarySync()
  const { mutate: removeLibrarySync } = useRemoveLibrarySync()
  const { data: librarySync } = useLibrarySync(openWith)
  const isLibraryUnlocked = useSignalValue(
    libraryStateSignal,
    selectIsLibraryUnlocked,
  )
  const { mutate: modifyLibrarySync } = useLibrarySyncIncrementalModify()

  return (
    <Drawer anchor="bottom" open={!!openWith} onClose={onClose}>
      {!openWith ? null : (
        <List>
          <ListItemButton
            component={Link}
            to={generatePath(ROUTES.LIBRARY_SYNC_DETAILS, { id: openWith })}
            onClick={() => {
              onClose()
            }}
          >
            <ListItemIcon>
              <InfoOutlineRounded />
            </ListItemIcon>
            <ListItemText primary="Go to details" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              syncLibrarySync(openWith)
              onClose()
            }}
          >
            <ListItemIcon>
              <SyncRounded />
            </ListItemIcon>
            <ListItemText primary="Sync now" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              const librarySyncWillBeHidden =
                !librarySync?.isProtected && !isLibraryUnlocked

              if (librarySyncWillBeHidden) {
                onClose()
              }

              modifyLibrarySync({
                id: openWith,
                mutationFunction: (old) => ({
                  ...old,
                  isProtected: !old.isProtected,
                }),
              })
            }}
          >
            <ListItemIcon>
              <Checkbox selected={!!librarySync?.isProtected} />
            </ListItemIcon>
            <ListItemText
              primary="Mark as protected"
              secondary="This will lock and hide books behind it. Use unlock features to display them"
            />
          </ListItemButton>
          <Divider />
          <ListItemButton
            onClick={() => {
              onClose()
              removeLibrarySync({ id: openWith })
            }}
          >
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove the library sync" />
          </ListItemButton>
        </List>
      )}
    </Drawer>
  )
})
