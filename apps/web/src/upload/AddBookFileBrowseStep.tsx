import { ArrowBackRounded } from "@mui/icons-material"
import {
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material"
import { memo, useMemo, useState } from "react"
import {
  collectSelectedFileNodes,
  LazyTreeView,
  type TreeNode,
} from "../common/FileTreeView"

export type AddBookFileBrowseStepProps = {
  /** Initial root-level items (e.g. from first listing). */
  initialItems: TreeNode[]
  /** Load children for a folder. Returned nodes are merged into the tree. */
  onLoadChildren: (nodeId: string) => Promise<TreeNode[]>
  /** Shown under the header (e.g. connector URL). */
  headerSubtitle?: string
  /** Called when user clicks Cancel. */
  onCancel: () => void
  /** Called when user clicks Go back. */
  onBack: () => void
  /** Called when user clicks Add with the selected file nodes. Build payload and call onClose(booksToAdd). */
  onAddBooks: (selectedFiles: TreeNode[]) => void
}

/**
 * Shared add-book file browse UI for plugins that list a remote tree (WebDAV, Synology, etc.).
 * Owns tree state, selection, and dialog layout; plugins supply data (initialItems, onLoadChildren)
 * and handle payload building (onAddBooks).
 */
function DefaultHeader({
  selectedCount,
  subtitle,
}: {
  selectedCount: number
  subtitle?: string
}) {
  return (
    <Stack gap={0.5}>
      <Typography variant="subtitle2">
        {selectedCount} file{selectedCount !== 1 ? "s" : ""} selected
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" variant="body2">
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}

export const AddBookFileBrowseStep = memo(function AddBookFileBrowseStep({
  initialItems,
  onLoadChildren,
  headerSubtitle,
  onCancel,
  onBack,
  onAddBooks,
}: AddBookFileBrowseStepProps) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const selectedFiles = useMemo(
    () => collectSelectedFileNodes(tree, selectedIds),
    [tree, selectedIds],
  )

  return (
    <>
      <DialogContent>
        <Stack gap={2} py={2}>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
          >
            <DefaultHeader
              selectedCount={selectedFiles.length}
              subtitle={headerSubtitle}
            />
          </Stack>
          <Divider />
          <LazyTreeView
            initialItems={initialItems}
            onLoadChildren={onLoadChildren}
            onTreeChange={setTree}
            selectedItems={selectedIds}
            onSelectedItemsChange={(_e, itemIds) => setSelectedIds(itemIds)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onBack}
          startIcon={<ArrowBackRounded />}
          variant="outlined"
        >
          Go back
        </Button>
        <Button
          disabled={!selectedFiles.length}
          onClick={() => onAddBooks(selectedFiles)}
          variant="contained"
        >
          Add {selectedFiles.length > 0 ? selectedFiles.length : ""} book
          {selectedFiles.length > 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </>
  )
})
