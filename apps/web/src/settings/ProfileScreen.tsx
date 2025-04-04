import { type FC, useCallback, useEffect, useState } from "react"
import {
  BarChartRounded,
  GavelRounded,
  LaunchRounded,
  LockOpenRounded,
  LockRounded,
  SecurityRounded,
  SettingsRounded,
  StorageRounded,
} from "@mui/icons-material"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import {
  Button,
  Dialog,
  DialogActions,
  Checkbox,
  DialogContent,
  DialogContentText,
  DialogTitle,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  useTheme,
  FormControlLabel,
  ListItemButton,
} from "@mui/material"
import { useNavigate } from "react-router"
import { useStorageUse } from "./useStorageUse"
import { useSignOut } from "../auth/useSignOut"
import { libraryStateSignal } from "../library/books/states"
import packageJson from "../../package.json"
import { toggleDebug } from "../debug"
import { useDatabase } from "../rxdb"
import { catchError, forkJoin, from, of, switchMap, takeUntil, tap } from "rxjs"
import { Logger } from "../debug/logger.shared"
import { isDebugEnabled } from "../debug/isDebugEnabled.shared"
import { useSignalValue, useUnmountObservable } from "reactjrx"
import { UnlockContentsDialog } from "../auth/UnlockContentsDialog"
import { authStateSignal } from "../auth/states.web"
import { useRemoveAllContents } from "./useRemoveAllContents"
import { createDialog } from "../common/dialogs/createDialog"
import { ROUTES } from "../navigation/routes"

export const ProfileScreen = () => {
  const navigate = useNavigate()
  const [isUnlockContentsDialogOpened, setIsUnlockContentsDialogOpened] =
    useState(false)
  const [isDeleteMyDataDialogOpened, setIsDeleteMyDataDialogOpened] =
    useState(false)
  const { quotaUsed, quotaInGb, usedInMb } = useStorageUse([])
  const auth = useSignalValue(authStateSignal)
  const library = useSignalValue(libraryStateSignal)
  const signOut = useSignOut()
  const theme = useTheme()
  const { mutate: removeAllContents } = useRemoveAllContents()

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        overflow: "auto",
        flexDirection: "column",
      }}
    >
      <TopBarNavigation title={"Profile"} showBack={false} />
      <List>
        <ListSubheader disableSticky>Account</ListSubheader>
        <ListItemButton onClick={(_) => signOut()}>
          <ListItemText primary="Sign out" secondary={auth?.email} />
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            if (library.isLibraryUnlocked) {
              libraryStateSignal.setValue((state) => ({
                ...state,
                isLibraryUnlocked: false,
              }))
            } else {
              setIsUnlockContentsDialogOpened(true)
            }
          }}
        >
          <ListItemText
            primary={
              library.isLibraryUnlocked
                ? "Protected contents are visible"
                : "Protected contents are hidden"
            }
            secondary={
              library.isLibraryUnlocked ? "Click to lock" : "Click to unlock"
            }
          />
          {library.isLibraryUnlocked && <LockOpenRounded color="action" />}
          {!library.isLibraryUnlocked && <LockRounded color="action" />}
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            navigate(ROUTES.SECURITY)
          }}
        >
          <ListItemIcon>
            <SecurityRounded />
          </ListItemIcon>
          <ListItemText primary="Security" />
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            navigate(ROUTES.STATISTICS)
          }}
        >
          <ListItemIcon>
            <BarChartRounded />
          </ListItemIcon>
          <ListItemText primary="Statistics" />
        </ListItemButton>
      </List>
      <List subheader={<ListSubheader disableSticky>Device</ListSubheader>}>
        <ListItemButton
          onClick={() => {
            navigate(ROUTES.SETTINGS)
          }}
        >
          <ListItemIcon>
            <SettingsRounded />
          </ListItemIcon>
          <ListItemText primary="Device settings" />
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            navigate(`${ROUTES.PROFILE}/manage-storage`)
          }}
        >
          <ListItemIcon>
            <StorageRounded />
          </ListItemIcon>
          <ListItemText
            primary="Storage"
            secondary={`${usedInMb} MB (${(quotaUsed * 100).toFixed(
              2,
            )}%) used of ${quotaInGb} GB`}
          />
        </ListItemButton>
      </List>
      <List
        subheader={<ListSubheader disableSticky>Information</ListSubheader>}
      >
        <ListItemButton target="__blank" href={`https://docs.oboku.me/support`}>
          <ListItemIcon>
            <LaunchRounded />
          </ListItemIcon>
          <ListItemText primary={`Support Page`} />
        </ListItemButton>
        <ListItemButton target="__blank" href="https://docs.oboku.me">
          <ListItemIcon>
            <LaunchRounded />
          </ListItemIcon>
          <ListItemText primary={`Documentation Page`} />
        </ListItemButton>
        <ListItemButton
          onClick={() =>
            createDialog({ preset: "NOT_IMPLEMENTED", autoStart: true })
          }
        >
          <ListItemIcon>
            <GavelRounded />
          </ListItemIcon>
          <ListItemText primary="Terms of Service" />
        </ListItemButton>
        <ListItem>
          <ListItemText primary="App Version" secondary={packageJson.version} />
        </ListItem>
      </List>
      <List
        subheader={
          <ListSubheader disableSticky>Developer options</ListSubheader>
        }
      >
        <ListItemButton onClick={toggleDebug}>
          <ListItemText
            primary={
              isDebugEnabled() ? "Disable debug mode" : "Enable debug mode"
            }
          />
        </ListItemButton>
        {/* <ListItem
            button
            onClick={() => setIsDeleteMyDataDialogOpened(true)}
          >
            <ListItemText primary="Delete my data" />
          </ListItem> */}
      </List>
      <List
        subheader={
          <ListSubheader
            disableSticky
            style={{ color: theme.palette.error.dark }}
          >
            Danger zone
          </ListSubheader>
        }
        style={{ backgroundColor: alpha(theme.palette.error.light, 0.2) }}
      >
        <ListItemButton onClick={() => navigate(ROUTES.PROBLEMS)}>
          <ListItemText
            primary="Repair my account / anomalies"
            secondary="If you start noticing problems with your data (missing items, sync, ...) you may try to repair your account using one this section"
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            removeAllContents()
          }}
        >
          <ListItemText
            primary="Reset account"
            secondary="Remove all contents from your account"
          />
        </ListItemButton>
        <ListItemButton
          onClick={() =>
            createDialog({ preset: "NOT_IMPLEMENTED", autoStart: true })
          }
        >
          <ListItemText primary="Delete my account" />
        </ListItemButton>
      </List>

      <UnlockContentsDialog
        open={isUnlockContentsDialogOpened}
        onClose={() => setIsUnlockContentsDialogOpened(false)}
      />
      <DeleteMyDataDialog
        open={isDeleteMyDataDialogOpened}
        onClose={() => setIsDeleteMyDataDialogOpened(false)}
      />
    </div>
  )
}

const DeleteMyDataDialog: FC<{
  open: boolean
  onClose: () => void
}> = ({ onClose, open }) => {
  const [isTagChecked, setIsTagChecked] = useState(false)
  const [isBookChecked, setIsBookChecked] = useState(false)
  const [isCollectionChecked, setIsCollectionChecked] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const unMount$ = useUnmountObservable()
  const { db } = useDatabase()

  const onSubmit = useCallback(async () => {
    setIsDeleting(true)

    if (db) {
      const deleteTags$ = from(db.tag.find().exec()).pipe(
        switchMap((res) => from(db.tag.bulkRemove(res.map((r) => r._id)))),
      )

      const deleteBooks$ = from(db.book.find().exec()).pipe(
        switchMap((res) => from(db.book.bulkRemove(res.map((r) => r._id)))),
      )

      const deleteLinks$ = from(db.link.find().exec()).pipe(
        switchMap((res) => from(db.link.bulkRemove(res.map((r) => r._id)))),
      )

      const deleteCollections$ = from(db.obokucollection.find().exec()).pipe(
        switchMap((res) =>
          from(db.obokucollection.bulkRemove(res.map((r) => r._id))),
        ),
      )

      forkJoin([
        isTagChecked ? deleteTags$ : of(undefined),
        isBookChecked ? deleteBooks$ : of(undefined),
        isBookChecked ? deleteLinks$ : of(undefined),
        isCollectionChecked ? deleteCollections$ : of(undefined),
      ])
        .pipe(
          catchError((e) => {
            Logger.error(e)

            return of(undefined)
          }),
          tap(() => {
            onClose()
          }),
          takeUntil(unMount$),
        )
        .subscribe()
    }
  }, [onClose, db, unMount$, isTagChecked, isBookChecked, isCollectionChecked])

  useEffect(() => {
    void open
    setIsDeleting(false)
    setIsTagChecked(false)
    setIsBookChecked(false)
    setIsCollectionChecked(false)
  }, [open])

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Delete my data</DialogTitle>
      <DialogContent>
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <DialogContentText>This action is permanent.</DialogContentText>
          <FormControlLabel
            control={
              <Checkbox
                checked={isTagChecked}
                disabled={isDeleting}
                onChange={() => {
                  setIsTagChecked((v) => !v)
                }}
                name="tags"
              />
            }
            label="Delete all my tags"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isBookChecked}
                disabled={isDeleting}
                onChange={() => {
                  setIsBookChecked((v) => !v)
                }}
                name="books"
              />
            }
            label="Delete all my books"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isCollectionChecked}
                disabled={isDeleting}
                onChange={() => {
                  setIsCollectionChecked((v) => !v)
                }}
                name="collections"
              />
            }
            label="Delete all my collections"
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary" disabled={isDeleting}>
          {isDeleting ? `Deleting...` : `Confirm`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
