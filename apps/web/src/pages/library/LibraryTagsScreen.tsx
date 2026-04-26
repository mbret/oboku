import { useState, useCallback, useMemo } from "react"
import { Box, Button } from "@mui/material"
import { TagActionsDrawer } from "../../tags/TagActionsDrawer"
import { TagList } from "../../tags/tagList/TagList"
import { useTagIds } from "../../tags/helpers"
import { openAddTagDialog } from "../../tags/AddTagDialog"
import { authorizeAction } from "../../auth/AuthorizeActionDialog"

export const LibraryTagsScreen = () => {
  const [isTagActionsDrawerOpenedWith, setIsTagActionsDrawerOpenedWith] =
    useState<string | undefined>(undefined)
  const { data: tags = [] } = useTagIds()

  const listHeader = useMemo(
    () => (
      <Box
        sx={{
          p: 2,
          pt: 2,
        }}
      >
        <Button fullWidth variant="outlined" onClick={openAddTagDialog}>
          Create a new tag
        </Button>
      </Box>
    ),
    [],
  )

  const listRenderHeader = useCallback(() => listHeader, [listHeader])

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <TagList
        style={{
          height: "100%",
        }}
        data={tags}
        restoreScrollId="libraryTagList"
        renderHeader={listRenderHeader}
        onItemClick={(tag) => {
          const action = () => setIsTagActionsDrawerOpenedWith(tag?._id)

          if (tag?.isProtected) {
            authorizeAction(action)
          } else {
            action()
          }
        }}
      />
      <TagActionsDrawer
        openWith={isTagActionsDrawerOpenedWith}
        onClose={() => setIsTagActionsDrawerOpenedWith(undefined)}
      />
    </div>
  )
}
