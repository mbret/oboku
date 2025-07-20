import { Button, Stack, Typography } from "@mui/material"
import { useDrivePicker } from "./useDrivePicker"
import { catchError, of, switchMap, takeUntil, tap } from "rxjs"
import { isDefined, useMutation$, useUnmountObservable } from "reactjrx"
import { type TreeItem, type TreeNode, TreeView } from "./TreeView"
import { useRequestPopupDialog } from "../../useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useQueries } from "@tanstack/react-query"
import { useCreateDriveFileQuery } from "../../../google/useDriveFile"
import {
  isDriveResponseError,
  type DriveFileGetResponse,
} from "../../../google/useDriveFilesGet"
import { type Control, useController } from "react-hook-form"
import type { DataSourceFormData } from "../../types"
import type { GoogleDriveDataSourceDocType } from "@oboku/shared"
import { CheckRounded, InfoOutlineRounded } from "@mui/icons-material"
import { useRequestFilesAccess } from "./useRequestFilesAccess"
import { useGoogleScripts } from "./scripts"

const isFolder = (file: NonNullable<DriveFileGetResponse["result"]>) =>
  file.mimeType === "application/vnd.google-apps.folder"

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

const useTreeViewItems = (items: readonly string[]) => {
  const createQuery = useCreateDriveFileQuery()

  return useQueries({
    queries: items.map((id) => createQuery(id)),
  })
}

export const DataSourceForm = ({
  control,
}: {
  control: Control<DataSourceFormData, any, DataSourceFormData>
}) => {
  const { getGoogleScripts } = useGoogleScripts()
  const {
    field: { onChange, value },
    fieldState: { invalid, isTouched, isDirty },
    formState: { touchedFields, dirtyFields },
  } = useController({
    control,
    rules: { required: false },
    name: "data",
  })
  const { items = [] } =
    (value as GoogleDriveDataSourceDocType["data_v2"]) ?? {}
  const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
  const requestFilesAccess = useRequestFilesAccess({ requestPopup })
  const { mutate: requestFilesAccessMutation } = useMutation$({
    mutationFn: () =>
      getGoogleScripts().pipe(
        switchMap(([, gapi]) => requestFilesAccess(gapi, items)),
      ),
  })
  const { pick } = useDrivePicker({
    requestPopup,
  })
  const queries = useTreeViewItems(items)
  const driveFiles = queries
    .map((query) => query.data?.result)
    .filter(isDefined)
  const hasMissingPermissions = queries.some(
    (query) => isDriveResponseError(query.error) && query.error.status === 404,
  )
  const treeViewItems = buildTree(
    driveFiles.map(
      (file): TreeItem => ({
        id: file?.id ?? "",
        type: isFolder(file) ? "folder" : "file",
        parentId: file?.parents?.[0] ?? "",
        label: file?.name ?? "",
      }),
    ),
  )
  const unMount$ = useUnmountObservable()

  console.log({ hasMissingPermissions, queries, items, treeViewItems })

  return (
    <Stack gap={2} pb={2} overflow="auto" border="1px solid red">
      <Stack px={2} gap={1} maxWidth="sm">
        <Button
          onClick={() => {
            pick({ select: "folder", multiSelect: true })
              .pipe(
                tap((data) => {
                  if (data.action === google.picker.Action.PICKED) {
                    const newData = [
                      ...items,
                      ...(data.docs?.map((i) => i.id) ?? []),
                    ]

                    const newItems = newData.reduce(
                      function reduceWithoutDuplicates(
                        acc: typeof newData,
                        itemId,
                      ) {
                        if (acc.find((entry) => entry === itemId)) {
                          return acc
                        }

                        return [...acc, itemId]
                      },
                      [],
                    )

                    onChange({
                      target: {
                        value: {
                          items: newItems,
                        },
                      },
                    })
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
          Add folders/files
        </Button>
        <Button
          variant="text"
          startIcon={
            hasMissingPermissions ? <InfoOutlineRounded /> : <CheckRounded />
          }
          onClick={() => {
            requestFilesAccessMutation()
          }}
          disabled={!hasMissingPermissions}
        >
          {hasMissingPermissions
            ? `Grant access to see the tree`
            : `Access granted`}
        </Button>
        <Typography variant="caption">
          {items.length} item(s) selected
        </Typography>
      </Stack>
      <TreeView items={treeViewItems} />
    </Stack>
  )
}
