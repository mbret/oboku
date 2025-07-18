import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import { ArrowBackIosRounded, LocalOfferRounded } from "@mui/icons-material"
import { type FC, useState } from "react"
import { useTagIds, useTags } from "../../tags/helpers"
import type { GoogleDriveDataSourceData } from "@oboku/shared"
import { useDrivePicker } from "./lib/useDrivePicker"
import { TagsSelectionDialog } from "../../tags/TagsSelectionDialog"
import { catchError, of, takeUntil, tap } from "rxjs"
import { useUnmountObservable } from "reactjrx"
import { useCreateDataSource } from "../../dataSources/useCreateDataSource"

export const GoogleDriveDataSource: FC<{
  onClose: () => void
  requestPopup: () => Promise<boolean>
}> = ({ onClose, requestPopup }) => {
  const [selectedTags, setSelectedTags] = useState<{
    [key: string]: true | undefined
  }>({})
  const [isTagSelectionOpen, setIsTagSelectionOpen] = useState(false)
  const { mutate: addDataSource } = useCreateDataSource()
  const [selectedFolder, setSelectedFolder] = useState<
    { name: string; id: string } | undefined
  >(undefined)
  const [folderChain, setFolderChain] = useState<
    { name: string; id: string }[]
  >([{ name: "", id: "root" }])
  const currentFolder = folderChain[folderChain.length - 1]
  const { data: tags } = useTags()
  const { data: tagIds = [] } = useTagIds()
  const { pick } = useDrivePicker({
    requestPopup,
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  })
  const unMount$ = useUnmountObservable()

  return (
    <>
      <List>
        <ListItem onClick={() => setIsTagSelectionOpen(true)}>
          <ListItemIcon>
            <LocalOfferRounded />
          </ListItemIcon>
          <ListItemText
            primary="Apply tags"
            secondary={Object.keys(selectedTags)
              .map((id) => tags?.find((tag) => tag?._id === id)?.name)
              .join(" ")}
          />
        </ListItem>
        <ListItem>
          <Typography noWrap>
            Selected: {selectedFolder?.name || "None"}
          </Typography>
        </ListItem>
        {currentFolder?.id !== "root" && (
          <ListItem>
            <Button
              style={{
                flex: 1,
              }}
              startIcon={<ArrowBackIosRounded style={{}} />}
              variant="outlined"
              color="primary"
              onClick={() => {
                setFolderChain((value) => value.slice(0, value.length - 1))
              }}
            >
              Go back
            </Button>
          </ListItem>
        )}
      </List>
      <Stack px={2} gap={1} maxWidth="sm">
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            pick({ select: "folder", multiSelect: false })
              .pipe(
                tap((data) => {
                  const doc = data.docs?.[0]
                  const { name, id } = doc ?? {}

                  if (
                    data.action === google.picker.Action.PICKED &&
                    name &&
                    id
                  ) {
                    setSelectedFolder({ name, id })
                  }
                }),
                takeUntil(unMount$),
                catchError((error) => {
                  console.error(error)

                  return of(null)
                }),
              )
              .subscribe()
          }}
        >
          Choose a folder
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
                folderName: selectedFolder.name,
              }

              addDataSource({
                type: `DRIVE`,
                data_v2: customData,
              })
            }
          }}
        >
          Confirm
        </Button>
      </Stack>
      <TagsSelectionDialog
        open={isTagSelectionOpen}
        onClose={() => setIsTagSelectionOpen(false)}
        title="Choose tags to apply automatically"
        data={tagIds}
        hasBackNavigation
        selected={(id) => !!selectedTags[id]}
        onItemClick={({ id }) => {
          if (selectedTags[id]) {
            setSelectedTags(({ [id]: removed, ...rest }) => rest)
          } else {
            setSelectedTags((value) => ({ ...value, [id]: true }))
          }
        }}
      />
    </>
  )
}
