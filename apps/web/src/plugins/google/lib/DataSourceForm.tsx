import { Stack } from "@mui/material"
import { useDrivePicker } from "./useDrivePicker"
import { catchError, of, switchMap, takeUntil, tap } from "rxjs"
import { isDefined, useMutation$ } from "reactjrx"
import { type TreeItem, TreeView } from "../../../common/FileTreeView"
import { useRequestPopupDialog } from "../../useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useQueries } from "@tanstack/react-query"
import { useCreateDriveFileQuery } from "../../../google/useDriveFile"
import { isDriveResponseError } from "../../../google/useDriveFilesGet"
import { useController, useForm } from "react-hook-form"
import { useRequestFilesAccess } from "./useRequestFilesAccess"
import { useGoogleScripts } from "./scripts"
import { isFolder } from "./utils"
import { useMemo, useState } from "react"
import { buildTree } from "../../../common/FileTreeView"
import { useUnmountSubject } from "../../../common/rxjs/useUnmountSubject"
import { DataSourceFormLayout } from "../../common/DataSourceFormLayout"
import { PickItemsSection } from "../../common/PickItemsSection"
import { TreeActionsSection } from "../../common/TreeActionsSection"
import type { GoogleDriveDataSourceDocType } from "@oboku/shared"
import type {
  DataSourceFormData,
  DataSourceFormInternalProps,
} from "../../types"

type GoogleDriveFormData = DataSourceFormData<{
  items: string[]
}>

export const DataSourceForm = ({
  dataSource,
  onSubmit,
  submitLabel,
}: DataSourceFormInternalProps<GoogleDriveDataSourceDocType>) => {
  const { getGoogleScripts } = useGoogleScripts()
  const { control, handleSubmit } = useForm<GoogleDriveFormData>({
    mode: "onChange",
    defaultValues: {
      name: dataSource?.name ?? "",
      tags: [...(dataSource?.tags ?? [])],
      items: [...(dataSource?.data_v2?.items ?? [])],
    },
  })
  const {
    field: { onChange: setItems, value: items },
  } = useController({
    control,
    rules: { required: false },
    name: "items",
  })
  const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
  const requestFilesAccess = useRequestFilesAccess({ requestPopup })
  const unmountSubject = useUnmountSubject()
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

  return (
    <DataSourceFormLayout
      control={control}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          name: data.name,
          tags: data.tags,
          data_v2: { items: data.items },
        }),
      )}
      submitLabel={submitLabel}
    >
      <Stack
        sx={{
          gap: 2,
          pb: 2,
          overflow: "auto",
        }}
      >
        <PickItemsSection
          itemsCount={items.length}
          onAction={() => {
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

                    setItems(newItems)
                  }
                }),
                takeUntil(unmountSubject),
                catchError((error) => {
                  console.error(error)

                  return of(null)
                }),
              )
              .subscribe()
          }}
          resolveItemsAccess={
            items.length > 0 && hasMissingPermissions
              ? {
                  onAction: () => {
                    requestFilesAccessMutation()
                  },
                }
              : undefined
          }
        />
        <TreeActionsSection
          onDeleteSelectedItems={() => {
            setSelectedItems([])
            setItems(items.filter((item) => !selectedItems.includes(item)))
          }}
          selectedItemsCount={selectedItems.length}
        >
          <TreeView
            items={treeViewItems}
            selectedItems={selectedItems}
            checkboxSelection
            onSelectedItemsChange={(_, items) => setSelectedItems(items)}
          />
        </TreeActionsSection>
      </Stack>
    </DataSourceFormLayout>
  )
}
