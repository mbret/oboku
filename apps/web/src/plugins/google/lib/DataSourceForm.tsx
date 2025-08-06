import { Alert, Button, IconButton, Stack, Typography } from "@mui/material"
import { useDrivePicker } from "./useDrivePicker"
import { catchError, of, switchMap, takeUntil, tap } from "rxjs"
import { isDefined, useMutation$, useUnmountObservable } from "reactjrx"
import { type TreeItem, TreeView } from "./tree/TreeView"
import { useRequestPopupDialog } from "../../useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useQueries } from "@tanstack/react-query"
import { useCreateDriveFileQuery } from "../../../google/useDriveFile"
import { isDriveResponseError } from "../../../google/useDriveFilesGet"
import { type Control, useController } from "react-hook-form"
import type { DataSourceFormData } from "../../types"
import type { GoogleDriveDataSourceDocType } from "@oboku/shared"
import { useRequestFilesAccess } from "./useRequestFilesAccess"
import { useGoogleScripts } from "./scripts"
import { isFolder } from "./utils"
import { DeleteRounded } from "@mui/icons-material"
import { useMemo, useState } from "react"
import { buildTree } from "./tree/buildTree"
import { useConfirmation } from "../../../common/useConfirmation"

export const DataSourceForm = ({
  control,
}: {
  control: Control<DataSourceFormData, any, DataSourceFormData>
}) => {
  const { getGoogleScripts } = useGoogleScripts()
  const {
    field: { onChange, value },
  } = useController({
    control,
    rules: { required: false },
    name: "data",
  })
  const { items = [] } =
    (value as GoogleDriveDataSourceDocType["data_v2"]) ?? {}
  const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
  const confirmation = useConfirmation()
  const requestFilesAccess = useRequestFilesAccess({ requestPopup })
  const { mutate: requestFilesAccessMutation } = useMutation$({
    mutationFn: () =>
      getGoogleScripts().pipe(
        switchMap(([, gapi]) => requestFilesAccess(gapi, items)),
      ),
  })
  const createQuery = useCreateDriveFileQuery()
  const { pick } = useDrivePicker({
    requestPopup,
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const queries = useQueries({
    queries: items.map((id) => createQuery(id)),
  })
  const hasMissingPermissions = queries.some(
    (query) => isDriveResponseError(query.error) && query.error.status === 404,
  )
  const treeViewItems = useMemo(() => {
    const driveFiles = queries
      .map((query) => query.data?.result)
      .filter(isDefined)
      .map(
        (file): TreeItem => ({
          id: file?.id ?? "",
          type: isFolder(file) ? "folder" : "file",
          parentId: file?.parents?.[0] ?? "",
          label: file?.name ?? "",
          fileType: file?.mimeType,
        }),
      )

    return buildTree(driveFiles)
  }, [queries])
  const unMount$ = useUnmountObservable()

  return (
    <Stack gap={2} pb={2} overflow="auto">
      <Stack gap={1}>
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
        <Typography variant="caption" align="center">
          You have {items.length} item(s) registered
        </Typography>
        {items.length > 0 && hasMissingPermissions && (
          <Alert
            severity="warning"
            action={
              <Button
                size="small"
                sx={{ alignSelf: "center" }}
                onClick={() => {
                  requestFilesAccessMutation()
                }}
              >
                Grant
              </Button>
            }
          >
            We are missing permissions for some of the files. Please grant
            access to see the entire tree.
          </Alert>
        )}
      </Stack>
      <Stack gap={1}>
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="caption">
            selected item(s): {selectedItems.length}
          </Typography>
          <IconButton
            disabled={selectedItems.length === 0}
            onClick={() => {
              const confirmed = confirmation()

              if (!confirmed) {
                return
              }

              setSelectedItems([])

              onChange({
                target: {
                  value: {
                    items: items.filter(
                      (item) => !selectedItems.includes(item),
                    ),
                  },
                },
              })
            }}
          >
            <DeleteRounded />
          </IconButton>
        </Stack>
        <TreeView
          items={treeViewItems}
          selectedItems={selectedItems}
          checkboxSelection
          onSelectedItemsChange={(_, items) => setSelectedItems(items)}
        />
      </Stack>
    </Stack>
  )
}
