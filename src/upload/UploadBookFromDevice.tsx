import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Typography } from '@material-ui/core'
import React, { FC } from 'react'
import { useAddBookFromFile } from '../books/helpers'
import { useDropzone } from 'react-dropzone'
import { Report } from '../report'
import { READER_SUPPORTED_EXTENSIONS } from 'oboku-shared'

export const UploadBookFromDevice: FC<{
  open: boolean,
  onClose: () => void
}> = ({ open, onClose }) => {
  const addBookFromFile = useAddBookFromFile()
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: READER_SUPPORTED_EXTENSIONS.join(',')
  })

  const handleConfirm = async () => {
    onClose()
    try {
      await Promise.all(acceptedFiles.map(file => addBookFromFile(file)))
    } catch (e) {
      Report.error(e)
    }
  }

  return (
    <Dialog onClose={onClose} open={open} fullScreen>
      <DialogTitle>Add a book from device</DialogTitle>
      <DialogContent style={{ display: 'flex' }}>
        <Box {...getRootProps({ className: 'dropzone' })} display="flex" flex={1} alignItems="center" justifyContent="center">
          <input {...getInputProps()} />
          {acceptedFiles.length > 0
            ? (
              <List >
                {acceptedFiles.map((file, i) => (
                  <ListItem disableGutters key={i}>
                    <ListItemText
                      primary={file.name}
                    />
                  </ListItem>
                ))}
              </List>
            )
            : (
              <Typography>Drag 'n' drop some files here, or click to select files</Typography>
            )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" disabled={acceptedFiles.length === 0}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog >
  )
}