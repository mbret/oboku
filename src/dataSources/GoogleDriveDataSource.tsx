import { useMutation } from '@apollo/client'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Typography, useTheme } from '@material-ui/core'
import { ArrowBackIosRounded, ArrowForwardIosRounded, CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons'
import { Alert } from '@material-ui/lab'
import React, { FC, useState } from 'react'
import { DataSourceType, MutationAddDataSourceDocument } from '../generated/graphql'
import { useFolders } from '../google'
import { generateUniqueID } from '../utils'

export const GoogleDriveDataSource: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [addDataSource, { data: addDataSourceData }] = useMutation(MutationAddDataSourceDocument, { onCompleted: onClose })
  const [selectedFolder, setSelectedFolder] = useState<{ name: string, id: string } | undefined>(undefined)
  const [folderChain, setFolderChain] = useState<{ name: string, id: string }[]>([{ name: '', id: 'root' }])
  const currentFolder = folderChain[folderChain.length - 1]
  const theme = useTheme()
  const data = useFolders({ parent: currentFolder.id })

  console.log('[GoogleDriveDataSource]', addDataSourceData)

  return (
    <Dialog onClose={onClose} open fullScreen>
      <DialogTitle>Select a folder</DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        <Alert severity="info">Only your public shared folder will be displayed</Alert>
        <List style={{ flex: 1 }}>
          <ListSubheader disableSticky>
            <Typography noWrap>
              {folderChain.length === 1 ? '/' : folderChain.map(({ name }) => name).join(' / ')}
            </Typography>
          </ListSubheader>
          <ListItem>
            <Typography noWrap>Selected: {selectedFolder?.name || 'None'}</Typography>
          </ListItem>
          {currentFolder.id !== 'root' && (
            <ListItem>
              <Button
                style={{
                  flex: 1,
                }}
                startIcon={<ArrowBackIosRounded style={{}} />}
                variant="outlined"
                color="primary"
                onClick={() => {
                  setFolderChain(value => value.slice(0, value.length - 1))
                }}
              >Go back</Button>
            </ListItem>
          )}
          {!data && (
            <ListItem style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ListItemText style={{ textAlign: 'center', paddingTop: theme.spacing(2) }} primary={<CircularProgress />} />
            </ListItem>
          )}
          {data && data.map(item => (
            <ListItem
              key={item.id}
              onClick={() => {
                if (selectedFolder?.id === item.id) {
                  setSelectedFolder(undefined)
                } else {
                  setSelectedFolder({ name: item.name, id: item.id })
                }
              }}
            >
              <ListItemIcon>
                {selectedFolder?.id === item.id ? <CheckCircleRounded /> : <RadioButtonUncheckedOutlined />}
              </ListItemIcon>
              <ListItemText primary={<Typography noWrap>{item?.name}</Typography>} />
              <ArrowForwardIosRounded onClick={(e) => {
                e.stopPropagation()
                setFolderChain(chain => [...chain, {
                  name: item?.name,
                  id: item?.id
                }])
              }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          color="primary"
          disabled={!selectedFolder}
          onClick={() => {
            addDataSource({ variables: { id: generateUniqueID(), type: DataSourceType.Drive, data: JSON.stringify(selectedFolder) } })
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}