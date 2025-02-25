import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material"
import { useDropzone } from "react-dropzone"
import { Report } from "../../debug/report.shared"
import { READER_ACCEPTED_FILE_TYPES } from "@oboku/shared"
import type { ObokuPlugin } from "../types"
import { type DragEventHandler, useRef } from "react"
import { useAddBookFromFile } from "./useAddBookFromFile"

export const UploadBook: ObokuPlugin["UploadBookComponent"] & {
  openFrom?: string
} = ({ onClose, onDragLeave }) => {
  const { mutate: addBookFromFile } = useAddBookFromFile()
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: READER_ACCEPTED_FILE_TYPES,
  })
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleConfirm = async () => {
    onClose()

    try {
      await Promise.all(acceptedFiles.map((file) => addBookFromFile(file)))
    } catch (e) {
      Report.error(e)
    }
  }

  const _onDragLeave: DragEventHandler<HTMLDivElement> = (e) => {
    onDragLeave?.(e)
  }

  return (
    <Dialog
      onClose={() => onClose()}
      componentsProps={{
        root: {
          ref: dialogRef,
          onDragLeave: _onDragLeave,
        },
      }}
      open
      fullScreen
    >
      <DialogTitle>Add a book from device</DialogTitle>
      <DialogContent style={{ display: "flex" }}>
        <div
          {...getRootProps({ className: "dropzone" })}
          style={{
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            display: "flex",
          }}
        >
          <input {...getInputProps()} />
          {acceptedFiles.length > 0 ? (
            <List>
              {acceptedFiles.map((file, i) => (
                <ListItem disableGutters key={i}>
                  <ListItemText primary={file.name} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>
              Drag 'n' drop some files here, or click to select files
            </Typography>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          disabled={acceptedFiles.length === 0}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
