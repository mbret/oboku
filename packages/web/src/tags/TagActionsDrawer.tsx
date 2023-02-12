import { useState, FC, useEffect } from "react"
import Dialog from "@mui/material/Dialog"
import {
  DialogTitle,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  DialogActions,
  Button,
  Divider,
  DialogContent,
  TextField
} from "@mui/material"
import {
  CheckCircleRounded,
  DeleteForeverRounded,
  EditRounded,
  LibraryAddRounded,
  RadioButtonUncheckedOutlined
} from "@mui/icons-material"
import { useRemoveTag, useUpdateTag } from "./helpers"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { normalizedTagsState, useTag } from "./states"
import { isManageTagBooksDialogOpenedWithState } from "./ManageTagBooksDialog"
import { useDatabase } from "../rxdb"

export const TagActionsDrawer: FC<{
  openWith: string | undefined
  onClose: () => void
}> = ({ openWith, onClose }) => {
  const setIsManageTagBooksDialogOpenedWithState = useSetRecoilState(
    isManageTagBooksDialogOpenedWithState
  )
  const { db$ } = useDatabase()
  const tag = useTag(db$, openWith || "-1")
  const editTag = useUpdateTag()
  const [isEditTagDialogOpenedWithId, setIsEditTagDialogOpenedWithId] =
    useState<string | undefined>(undefined)
  const [removeTag] = useRemoveTag()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={!!openWith}
        onClose={onClose}
        transitionDuration={0}
      >
        <List>
          <ListItem
            button
            onClick={() => setIsEditTagDialogOpenedWithId(openWith)}
          >
            <ListItemIcon>
              <EditRounded />
            </ListItemIcon>
            <ListItemText primary="Rename" />
          </ListItem>
          <ListItem
            button
            onClick={() =>
              openWith &&
              editTag({ _id: openWith, isProtected: !tag?.isProtected })
            }
          >
            <ListItemIcon>
              {!tag?.isProtected && <RadioButtonUncheckedOutlined />}
              {tag?.isProtected && <CheckCircleRounded />}
            </ListItemIcon>
            <ListItemText
              primary="Mark as protected"
              secondary="This will lock and hide books behind it. Use unlock features to display them"
            />
          </ListItem>
          <ListItem
            button
            onClick={() =>
              openWith &&
              editTag({ _id: openWith, isBlurEnabled: !tag?.isBlurEnabled })
            }
          >
            <ListItemIcon>
              {!tag?.isBlurEnabled && <RadioButtonUncheckedOutlined />}
              {tag?.isBlurEnabled && <CheckCircleRounded />}
            </ListItemIcon>
            <ListItemText
              primary="Blur covers"
              secondary="Apply a blur filter on book covers. Useful for sensitive content"
            />
          </ListItem>
          <ListItem
            button
            onClick={() => {
              onClose()
              setIsManageTagBooksDialogOpenedWithState(openWith)
            }}
          >
            <ListItemIcon>
              <LibraryAddRounded />
            </ListItemIcon>
            <ListItemText primary="Manage books" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => {
              onClose()
              openWith && removeTag({ id: openWith })
            }}
          >
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove" />
          </ListItem>
        </List>
      </Drawer>
      <EditTagDialog
        id={isEditTagDialogOpenedWithId}
        onClose={() => {
          setIsEditTagDialogOpenedWithId(undefined)
          onClose()
        }}
        open={!!isEditTagDialogOpenedWithId}
      />
    </>
  )
}

const EditTagDialog: FC<{
  open: boolean
  id: string | undefined
  onClose: () => void
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState("")
  const { db$ } = useDatabase()
  const { name: tagName } = useTag(db$, id || "-1") || {}
  const editTag = useUpdateTag()

  const onInnerClose = () => {
    setName("")
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editTag({ _id: id, name })
    }
  }

  useEffect(() => {
    setName((prev) => tagName || prev)
  }, [tagName, id])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Tag: {tagName}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            id && onConfirm(id, name)
          }}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
