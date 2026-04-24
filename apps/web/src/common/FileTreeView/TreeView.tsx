import { Collapse, CircularProgress, Typography } from "@mui/material"
import {
  FolderRounded,
  InsertDriveFileRounded,
  PictureAsPdf,
} from "@mui/icons-material"
import React, { type Ref } from "react"
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
import type { TreeItem, TreeNode } from "./types"

function getIconFromFileType(fileType?: string) {
  switch (fileType) {
    case "application/pdf":
      return PictureAsPdf
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
  const icon =
    status.expandable && item?.isLoading
      ? function LoadingIcon() {
          return <CircularProgress size={20} color="inherit" />
        }
      : status.expandable
        ? FolderRounded
        : getIconFromFileType(item?.fileType)
  const {
    icon: LabelIcon,
    expandable: _expandable,
    ...labelProps
  } = getLabelProps({
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
          {/**
           * MUI applies aria-hidden to the checkbox wrapper, so the browser
           * refuses to keep focus here and emits a warning when tabbing in.
           * Blurring on focus mirrors that behavior and prevents a focus trap
           * while keeping the checkbox toggleable via click/keyboard on the row.
           */}
          <TreeItemCheckbox
            {...getCheckboxProps()}
            onFocus={(e: React.FocusEvent<HTMLElement>) => e.target.blur()}
          />
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

export type { TreeItem, TreeNode } from "./types"

export const TreeView = (props: RichTreeViewProps<TreeNode, true>) => {
  return (
    <RichTreeView slots={{ item: CustomTreeItem }} multiSelect {...props} />
  )
}
