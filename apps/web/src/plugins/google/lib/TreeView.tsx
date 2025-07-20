import {
  Box,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import {
  ArrowBackIosRounded,
  FileOpenRounded,
  FolderRounded,
  LocalOfferRounded,
  RemoveCircleOutlineRounded,
} from "@mui/icons-material"
import React, { type FC, useState } from "react"
import { useTagIds, useTags } from "../../../tags/helpers"
import type { GoogleDriveDataSourceData } from "@oboku/shared"
import { useDrivePicker } from "./useDrivePicker"
import { TagsSelectionDialog } from "../../../tags/TagsSelectionDialog"
import { catchError, of, takeUntil, tap } from "rxjs"
import { useUnmountObservable } from "reactjrx"
import { useCreateDataSource } from "../../../dataSources/useCreateDataSource"
import type { TreeViewBaseItem } from "@mui/x-tree-view/models"
import { RichTreeView } from "@mui/x-tree-view/RichTreeView"
import {
  // TreeItem,
  TreeItemCheckbox,
  TreeItemContent,
  TreeItemDragAndDropOverlay,
  TreeItemIcon,
  TreeItemIconContainer,
  TreeItemLabel,
  TreeItemProvider,
  TreeItemRoot,
  useTreeItem,
  useTreeItemModel,
} from "@mui/x-tree-view"

export type Item = google.picker.DocumentObject

export type TreeItem = {
  id: string
  parentId?: string
  type?: "file" | "folder"
  label: string
}

export type TreeNode = TreeItem & {
  children: TreeNode[]
}

function buildTree(items: TreeItem[]): TreeNode[] {
  // Create a map for quick lookup of items by id
  const itemMap = new Map<string, TreeNode>()

  // Initialize all items as tree nodes with empty children arrays
  items.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
    })
  })

  const roots: TreeNode[] = []

  // Build the tree structure by connecting parents and children
  items.forEach((item) => {
    const node = itemMap.get(item.id)

    if (!node) return

    if (!item.parentId || item.parentId === "root") {
      // This is a root level item
      roots.push(node)
    } else {
      // This has a parent, add it to parent's children
      const parent = itemMap.get(item.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found in the list, treat as root
        roots.push(node)
      }
    }
  })

  return roots
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      // Folders come first
      if (a.type === "folder" && b.type !== "folder") return -1
      if (a.type !== "folder" && b.type === "folder") return 1

      // Then sort alphabetically by name
      return (a.label || "").localeCompare(b.label || "")
    })
    .map((node) => ({
      ...node,
      children: sortTree(node.children), // Recursively sort children
    }))
}

const getIconFromFileType = (fileType) => {
  switch (fileType) {
    case "folder":
      return FolderRounded
    default:
      return FileOpenRounded
  }
}

function CustomLabel({
  icon: Icon,
  expandable,
  children,
  ...other
}: {
  icon?: React.ReactNode
  expandable?: boolean
  children?: React.ReactNode
}) {
  return (
    <TreeItemLabel
      {...other}
      // sx={{
      //   display: "flex",
      //   alignItems: "center",
      // }}
    >
      {/* {Icon && (
        <Box
          component={Icon}
          className="labelIcon"
          color="inherit"
          sx={{ mr: 1, fontSize: "1.2rem" }}
        />
      )} */}

      <Typography>{children}</Typography>
      {/* {expandable && <DotIcon />} */}
    </TreeItemLabel>
  )
}

const CustomTreeItem = React.forwardRef(function CustomTreeItem(props, ref) {
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

  const item = useTreeItemModel(itemId)

  let icon

  if (status.expandable) {
    icon = FolderRounded
  } else if (item.fileType) {
    icon = getIconFromFileType(item.fileType)
  }

  const {
    icon: labelIcon,
    expandable,
    ...labelProps
  } = getLabelProps({
    icon,
    expandable: status.expandable && status.expanded,
  })

  return (
    <TreeItemProvider {...getContextProviderProps()}>
      <TreeItemRoot {...getRootProps(other)}>
        <TreeItemContent {...getContentProps()}>
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
            <Box
              component={labelIcon}
              className="labelIcon"
              color="inherit"
              sx={{ mr: 1, fontSize: "1.2rem" }}
            />
            <Typography>{label}</Typography>
          </TreeItemLabel>
          <TreeItemDragAndDropOverlay {...getDragAndDropOverlayProps()} />
        </TreeItemContent>
        {children && <Collapse {...getGroupTransitionProps()} />}
      </TreeItemRoot>
    </TreeItemProvider>
  )
})

export const TreeView = ({ items }: { items: TreeNode[] }) => {
  // const tree = buildTree(
  //   items.map((item) => ({
  //     ...item,
  //     label: item.name ?? "",
  //     type: item.type === "folder" ? "folder" : "file",
  //   })),
  // )

  return (
    <RichTreeView
      items={items}
      defaultExpandedItems={["1", "1.1"]}
      slots={{ item: CustomTreeItem }}
    />
  )
}
