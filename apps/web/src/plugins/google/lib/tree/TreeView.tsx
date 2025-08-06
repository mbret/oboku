import { Collapse, Typography } from "@mui/material"
import { FolderRounded, InsertDriveFileRounded } from "@mui/icons-material"
import React, { type Ref } from "react"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import { RichTreeView } from "@mui/x-tree-view/RichTreeView"
import {
  type RichTreeViewProps,
  TreeItemCheckbox,
  TreeItemContent,
  TreeItemDragAndDropOverlay,
  TreeItemIcon,
  TreeItemIconContainer,
  TreeItemLabel,
  type TreeItemProps,
  TreeItemProvider,
  TreeItemRoot,
  useTreeItem,
  useTreeItemModel,
} from "@mui/x-tree-view"
import { MIME_TYPE_FOLDER } from "../constants"

export type Item = google.picker.DocumentObject

export type TreeItem = {
  id: string
  parentId?: string
  type?: "file" | "folder"
  label: string
  fileType?: string
}

export type TreeNode = TreeItem & {
  children: TreeNode[]
}

const getIconFromFileType = (fileType?: string) => {
  switch (fileType) {
    case MIME_TYPE_FOLDER:
      return FolderRounded
    case "application/pdf":
      return PictureAsPdfIcon
    default:
      return InsertDriveFileRounded
  }
}

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
  props: TreeItemProps,
  ref: Ref<HTMLLIElement>,
) {
  const { id, itemId, label, disabled, children, ...other } = props
  const {
    getContextProviderProps,
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getCheckboxProps,
    getLabelProps,
    getGroupTransitionProps,
    getDragAndDropOverlayProps,
    status,
  } = useTreeItem({ id, itemId, children, label, disabled, rootRef: ref })
  const item = useTreeItemModel<TreeItem>(itemId)
  const icon = status.expandable
    ? FolderRounded
    : getIconFromFileType(item?.fileType)
  const { icon: LabelIcon, ...labelProps } = getLabelProps({
    icon,
    expandable: status.expandable && status.expanded,
  })
  const rootProps: ReturnType<typeof getRootProps> = getRootProps(other)

  return (
    <TreeItemProvider {...getContextProviderProps()}>
      <TreeItemRoot {...rootProps}>
        <TreeItemContent
          sx={{
            flexDirection: "row-reverse",
          }}
          {...getContentProps()}
        >
          <TreeItemIconContainer {...getIconContainerProps()}>
            <TreeItemIcon status={status} />
          </TreeItemIconContainer>
          <TreeItemCheckbox {...getCheckboxProps()} />
          <TreeItemLabel
            {...labelProps}
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {!!LabelIcon && (
              <LabelIcon fontSize="small" color="inherit" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">{label}</Typography>
          </TreeItemLabel>
          <TreeItemDragAndDropOverlay {...getDragAndDropOverlayProps()} />
        </TreeItemContent>
        {children && <Collapse {...getGroupTransitionProps()} />}
      </TreeItemRoot>
    </TreeItemProvider>
  )
})

export const TreeView = ({ ...other }: RichTreeViewProps<TreeNode, true>) => {
  return (
    <RichTreeView
      defaultExpandedItems={["1", "1.1"]}
      slots={{ item: CustomTreeItem }}
      multiSelect
      {...other}
    />
  )
}
