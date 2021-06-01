import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core'
import { ArrowBackIosRounded, LocalOfferRounded } from '@material-ui/icons'
import { FC, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { GoogleDriveDataSourceData } from '@oboku/shared'
import { tagIdsState, tagsAsArrayState } from '../../tags/states'
import { useCreateDataSource } from '../helpers'
import { DataSourceType } from '@oboku/shared'
import { DrivePicker } from './DrivePicker'
import { TagsSelectionDialog } from '../../tags/TagsSelectionDialog'

export const GoogleDriveDataSource: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: true | undefined }>({})
  const [isTagSelectionOpen, setIsTagSelectionOpen] = useState(false)
  const addDataSource = useCreateDataSource()
  const [selectedFolder, setSelectedFolder] = useState<{ name: string, id: string } | undefined>(undefined)
  const [folderChain, setFolderChain] = useState<{ name: string, id: string }[]>([{ name: '', id: 'root' }])
  const currentFolder = folderChain[folderChain.length - 1]
  const tags = useRecoilValue(tagsAsArrayState)
  const tagIds = useRecoilValue(tagIdsState)
  const [showDrive, setShowDrive] = useState(false)

  const onPick = (data: any) => {
    if (data.action !== 'loaded') {
      setShowDrive(false)
    }
    if (data.action === 'picked') {
      setSelectedFolder(data.docs[0])
    }
  }

  return (
    <>
      <Dialog onClose={onClose} open={!showDrive} fullScreen>
        <DialogTitle>Google Drive datasource</DialogTitle>
        <DialogContent style={{ padding: 0, display: 'flex', flexFlow: 'column' }}>
          <List >
            <ListItem onClick={() => setIsTagSelectionOpen(true)}>
              <ListItemIcon>
                <LocalOfferRounded />
              </ListItemIcon>
              <ListItemText
                primary="Apply tags"
                secondary={Object.keys(selectedTags).map(id => tags.find(tag => tag?._id === id)?.name).join(' ')}
              />
            </ListItem>
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
          </List>
          <Box flex={1} display="flex" justifyContent="center" alignItems="center">
            <Button color="primary" variant="contained" onClick={() => setShowDrive(true)}>
              Choose a folder
            </Button>
          </Box>
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
                  folderId: selectedFolder.id,
                  folderName: selectedFolder.name
                }
                addDataSource({
                  type: DataSourceType.DRIVE,
                  data: JSON.stringify(customData),
                })
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
        <TagsSelectionDialog
          open={isTagSelectionOpen}
          onClose={() => setIsTagSelectionOpen(false)}
          title="Choose tags to apply automatically"
          data={tagIds}
          hasBackNavigation
          selected={(id) => !!selectedTags[id]}
          onItemClick={({id}) => {
            if (selectedTags[id]) {
              setSelectedTags(({ [id]: removed, ...rest }) => rest)
            } else {
              setSelectedTags((value) => ({ ...value, [id]: true }))
            }
          }}
        />
      </Dialog >
      <DrivePicker show={showDrive} onClose={onPick} select="folder" />
    </>
  )
}