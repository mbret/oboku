import { FC, useCallback, useEffect, useState } from "react"
import {
  BarChartRounded,
  GavelRounded,
  LockOpenRounded,
  LockRounded,
  SettingsRounded,
  StorageRounded
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
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  TextField,
  Typography,
  useTheme,
  FormControlLabel
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useStorageUse } from "./useStorageUse"
import { LockActionBehindUserPasswordDialog } from "../auth/LockActionBehindUserPasswordDialog"
import { useSignOut } from "../auth/helpers"
import { useAccountSettings, useUpdateContentPassword } from "./helpers"
import { libraryStateSignal } from "../library/states"
import packageJson from "../../package.json"
import { ROUTES } from "../constants"
import { useDialogManager } from "../dialog"
import { toggleDebug } from "../debug"
import { useDatabase } from "../rxdb"
import { catchError, forkJoin, from, of, switchMap, takeUntil, tap } from "rxjs"
import { Report } from "../debug/report.shared"
import { isDebugEnabled } from "../debug/isDebugEnabled.shared"
import { SIGNAL_RESET, useSignalValue, useUnmountObservable } from "reactjrx"
import { firstTimeExperienceStateSignal } from "../firstTimeExperience/firstTimeExperienceStates"
import { unlockLibraryDialogSignal } from "../auth/UnlockLibraryDialog"
import { authStateSignal } from "../auth/authState"

export const ProfileScreen = () => {
  const navigate = useNavigate()
  const [lockedAction, setLockedAction] = useState<(() => void) | undefined>(
    undefined
  )
  const [
    isEditContentPasswordDialogOpened,
    setIsEditContentPasswordDialogOpened
  ] = useState(false)
  const [isDeleteMyDataDialogOpened, setIsDeleteMyDataDialogOpened] =
    useState(false)
  const [isLoadLibraryDebugOpened, setIsLoadLibraryDebugOpened] =
    useState(false)
  const { quotaUsed, quotaInGb, usedInMb } = useStorageUse([])
  const auth = useSignalValue(authStateSignal)
  const { data: accountSettings } = useAccountSettings()
  const library = useSignalValue(libraryStateSignal)
  const signOut = useSignOut()
  const theme = useTheme()
  const dialog = useDialogManager()

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        overflow: "scroll",
        flexDirection: "column"
      }}
    >
      <TopBarNavigation title={"Profile"} showBack={false} />
      <List>
        <ListSubheader disableSticky>Account</ListSubheader>
        <ListItem button onClick={(_) => signOut()}>
          <ListItemText primary="Sign out" secondary={auth?.email} />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            if (accountSettings?.contentPassword) {
              setLockedAction(
                (_) => () => setIsEditContentPasswordDialogOpened(true)
              )
            } else {
              setIsEditContentPasswordDialogOpened(true)
            }
          }}
        >
          <ListItemText
            primary="Protected contents password"
            secondary={
              accountSettings?.contentPassword
                ? "Change my password"
                : "Initialize my password"
            }
          />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            if (library.isLibraryUnlocked) {
              libraryStateSignal.setValue((state) => ({
                ...state,
                isLibraryUnlocked: false
              }))
            } else {
              unlockLibraryDialogSignal.setValue(true)
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
        </ListItem>
        <ListItem
          button
          onClick={() => {
            navigate(ROUTES.STATISTICS)
          }}
        >
          <ListItemIcon>
            <BarChartRounded />
          </ListItemIcon>
          <ListItemText primary="Statistics" />
        </ListItem>
      </List>
      <List
        subheader={
          <ListSubheader disableSticky>Settings & device</ListSubheader>
        }
      >
        <ListItem
          button
          onClick={() => {
            navigate(ROUTES.SETTINGS)
          }}
        >
          <ListItemIcon>
            <SettingsRounded />
          </ListItemIcon>
          <ListItemText primary="oboku settings" />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            navigate(`${ROUTES.PROFILE}/manage-storage`)
          }}
        >
          <ListItemIcon>
            <StorageRounded />
          </ListItemIcon>
          <ListItemText
            primary="Manage storage"
            secondary={`${usedInMb} MB (${(quotaUsed * 100).toFixed(
              2
            )}%) used of ${quotaInGb} GB`}
          />
        </ListItem>
      </List>
      <List
        subheader={
          <ListSubheader disableSticky>Help and feedback</ListSubheader>
        }
      >
        <ListItem button>
          <ListItemText
            primary="Do you need any help?"
            secondary={
              <Typography variant="body2" color="textSecondary">
                You can visit our{" "}
                <Link
                  target="__blank"
                  href="https://docs.oboku.me/support"
                  underline="hover"
                >
                  support page
                </Link>
              </Typography>
            }
          />
        </ListItem>
        <ListItem button>
          <ListItemText
            primary="I have a request"
            secondary={
              <Typography variant="body2" color="textSecondary">
                Whether it is a bug, a feature request or anything else, please
                visit the{" "}
                <Link
                  target="__blank"
                  href="https://docs.oboku.me"
                  underline="hover"
                >
                  doc
                </Link>{" "}
                to find all useful links
              </Typography>
            }
          />
        </ListItem>
        <ListItem
          button
          onClick={() => firstTimeExperienceStateSignal.setValue(SIGNAL_RESET)}
        >
          <ListItemText
            primary="Restart the welcome tour"
            secondary="This will display all the first time tours overlay again. Useful for a quick reminder on how to use the app"
          />
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>About</ListSubheader>}>
        <ListItem button onClick={() => dialog({ preset: "NOT_IMPLEMENTED" })}>
          <ListItemIcon>
            <GavelRounded />
          </ListItemIcon>
          <ListItemText primary="Terms of Service" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Version" secondary={packageJson.version} />
        </ListItem>
      </List>
      <>
        <List
          subheader={
            <ListSubheader disableSticky>Developer options</ListSubheader>
          }
        >
          <ListItem button onClick={toggleDebug}>
            <ListItemText
              primary={
                isDebugEnabled() ? "Disable debug mode" : "Enable debug mode"
              }
            />
          </ListItem>
          {/* <ListItem
            button
            onClick={() => setIsDeleteMyDataDialogOpened(true)}
          >
            <ListItemText primary="Delete my data" />
          </ListItem> */}
        </List>
      </>
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
        <ListItem button onClick={() => navigate(ROUTES.PROBLEMS)}>
          <ListItemText
            primary="Repair my account / anomalies"
            secondary="If you start noticing problems with your data (missing items, sync, ...) you may try to repair your account using one this section"
          />
        </ListItem>
        <ListItem button onClick={() => dialog({ preset: "NOT_IMPLEMENTED" })}>
          <ListItemText primary="Delete my account" />
        </ListItem>
      </List>
      <LockActionBehindUserPasswordDialog action={lockedAction} />
      <EditContentPasswordDialog
        open={isEditContentPasswordDialogOpened}
        onClose={() => setIsEditContentPasswordDialogOpened(false)}
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
        switchMap((res) => from(db.tag.bulkRemove(res.map((r) => r._id))))
      )

      const deleteBooks$ = from(db.book.find().exec()).pipe(
        switchMap((res) => from(db.book.bulkRemove(res.map((r) => r._id))))
      )

      const deleteLinks$ = from(db.link.find().exec()).pipe(
        switchMap((res) => from(db.link.bulkRemove(res.map((r) => r._id))))
      )

      const deleteCollections$ = from(db.obokucollection.find().exec()).pipe(
        switchMap((res) =>
          from(db.obokucollection.bulkRemove(res.map((r) => r._id)))
        )
      )

      forkJoin([
        isTagChecked ? deleteTags$ : of(undefined),
        isBookChecked ? deleteBooks$ : of(undefined),
        isBookChecked ? deleteLinks$ : of(undefined),
        isCollectionChecked ? deleteCollections$ : of(undefined)
      ])
        .pipe(
          catchError((e) => {
            Report.error(e)

            return of(undefined)
          }),
          tap(() => {
            onClose()
          }),
          takeUntil(unMount$.current)
        )
        .subscribe()
    }
  }, [onClose, db, unMount$, isTagChecked, isBookChecked, isCollectionChecked])

  useEffect(() => {
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

const EditContentPasswordDialog: FC<{
  open: boolean
  onClose: () => void
}> = ({ onClose, open }) => {
  const updatePassword = useUpdateContentPassword()
  const { data: accountSettings } = useAccountSettings()
  const [text, setText] = useState("")
  const contentPassword = accountSettings?.contentPassword || ""

  const onInnerClose = () => {
    onClose()
  }

  useEffect(() => {
    setText(contentPassword)
  }, [contentPassword])

  useEffect(() => {
    setText("")
  }, [open])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Set up your content password</DialogTitle>
      <DialogContent>
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <DialogContentText>
            This password will be needed to unlock and access books using a
            protected tag.
          </DialogContentText>
          <TextField
            autoFocus
            id="name"
            label="Password"
            type="password"
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={async () => {
            onInnerClose()
            updatePassword(text)
          }}
          color="primary"
        >
          Change
        </Button>
      </DialogActions>
    </Dialog>
  )
}
