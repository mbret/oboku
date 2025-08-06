import { useState, type FC, useEffect } from "react"
import Dialog from "@mui/material/Dialog"
import {
  DialogTitle,
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  DialogActions,
  Button,
  Divider,
  DialogContent,
  TextField,
  ListItemButton,
} from "@mui/material"
import {
  CheckCircleRounded,
  DeleteForeverRounded,
  EditRounded,
  LibraryAddRounded,
  RadioButtonUncheckedOutlined,
} from "@mui/icons-material"
import { useUpdateTag } from "./helpers"
import { useTag } from "./helpers"
import { isManageTagBooksDialogOpenedWithState } from "./ManageTagBooksDialog"
import { useRemoveTag } from "./useRemoveTag"

export const TagActionsDrawer: FC<{
  openWith: string | undefined
  onClose: () => void
}> = ({ openWith, onClose }) => {
  const { data: tag } = useTag(openWith)
  const editTag = useUpdateTag()
  const [isEditTagDialogOpenedWithId, setIsEditTagDialogOpenedWithId] =
    useState<string | undefined>(undefined)
  const { mutate: removeTag } = useRemoveTag()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={!!openWith}
        onClose={onClose}
        transitionDuration={0}
      >
        <List>
          <ListItemButton
            onClick={() => setIsEditTagDialogOpenedWithId(openWith)}
          >
            <ListItemIcon>
              <EditRounded />
            </ListItemIcon>
            <ListItemText primary="Rename" />
          </ListItemButton>
          <ListItemButton
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
          </ListItemButton>
          <ListItemButton
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
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              onClose()
              isManageTagBooksDialogOpenedWithState.setValue(openWith)
            }}
          >
            <ListItemIcon>
              <LibraryAddRounded />
            </ListItemIcon>
            <ListItemText primary="Manage books" />
          </ListItemButton>
        </List>
        <Divider />
        <List>
          <ListItemButton
            onClick={() => {
              openWith && removeTag({ _id: openWith })
              onClose()
            }}
          >
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove" />
          </ListItemButton>
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
  const { data: tag } = useTag(id)
  const { name: tagName } = tag ?? {}
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
    void id

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
