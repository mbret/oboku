import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Typography, useTheme } from '@material-ui/core'
import { ArrowBackIosRounded, ArrowForwardIosRounded, CheckCircleRounded, LocalOfferRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons'
import { Alert } from '@material-ui/lab'
import React, { FC, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { useFolders } from '../google'
import { GoogleDriveDataSourceData } from 'oboku-shared'
import { tagsAsArrayState } from '../tags/states'
import { TagsSelectionList } from '../tags/TagsSelectionList'
import { useCreateDataSource } from './helpers'
import { DataSourceType } from 'oboku-shared'

export const GoogleDriveDataSource: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: true | undefined }>({})
  const [isTagSelectionOpen, setIsTagSelectionOpen] = useState(false)
  const addDataSource = useCreateDataSource()
  const [selectedFolder, setSelectedFolder] = useState<{ name: string, id: string } | undefined>(undefined)
  const [folderChain, setFolderChain] = useState<{ name: string, id: string }[]>([{ name: '', id: 'root' }])
  const currentFolder = folderChain[folderChain.length - 1]
  const tags = useRecoilValue(tagsAsArrayState)
  const theme = useTheme()
  const data = useFolders({ parent: currentFolder.id })

  return (
    <Dialog onClose={onClose} open fullScreen>
      <DialogTitle>Select a folder</DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        <Alert severity="info">Only your public shared folder will be displayed</Alert>
        <List style={{ flex: 1 }}>
          <ListItem onClick={() => setIsTagSelectionOpen(true)}>
            <ListItemIcon>
              <LocalOfferRounded />
            </ListItemIcon>
            <ListItemText
              primary="Apply tags"
              secondary={Object.keys(selectedTags).map(id => tags.find(tag => tag?._id === id)?.name).join(' ')}
            />
          </ListItem>
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
            onClose()
            if (selectedFolder) {
              const customData: GoogleDriveDataSourceData = {
                applyTags: Object.keys(selectedTags),
                driveId: selectedFolder.id
              }
              addDataSource({
                type: DataSourceType.DRIVE,
                data: JSON.stringify(customData),
                lastSyncedAt: null
              })
            }
          }}
        >
          Confirm
        </Button>
      </DialogActions>
      <Dialog open={isTagSelectionOpen} onClose={() => setIsTagSelectionOpen(false)}>
        <DialogTitle>Choose tags to apply automatically</DialogTitle>
        <TagsSelectionList
          tags={tags}
          isSelected={(id) => !!selectedTags[id]}
          onItemClick={(id) => {
            if (selectedTags[id]) {
              setSelectedTags(({ [id]: removed, ...rest }) => rest)
            } else {
              setSelectedTags((value) => ({ ...value, [id]: true }))
            }
          }}
        />
        <DialogActions>
          <Button onClick={() => setIsTagSelectionOpen(false)} color="primary" autoFocus>
            Close
        </Button>
        </DialogActions>
      </Dialog>
    </Dialog >
  )
}