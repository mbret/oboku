import { Stack } from "@mui/material"
import { useDrivePicker } from "./useDrivePicker"
import { catchError, of, switchMap, takeUntil, tap } from "rxjs"
import { isDefined, useMutation$ } from "reactjrx"
import { type TreeItem, TreeView } from "../../../../common/FileTreeView"
import { useRequestPopupDialog } from "../../../plugins/useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useQueries } from "@tanstack/react-query"
import { useCreateDriveFileQuery } from "./useDriveFile"
import { isDriveResponseError } from "./useDriveFilesGet"
import { useController, useForm } from "react-hook-form"
import { useRequestFilesAccess } from "./useRequestFilesAccess"
import { useGoogleScripts } from "./scripts"
import { isFolder } from "./utils"
import { useMemo, useState } from "react"
import { buildTree } from "../../../../common/FileTreeView"
import { useUnmountSubject } from "../../../../common/rxjs/useUnmountSubject"
import { LibrarySyncFormLayout } from "../../../plugins/common/LibrarySyncFormLayout"
import {
  buildLibrarySyncSubmitPayload,
  getLibrarySyncFormBaseDefaults,
} from "../../../plugins/common/librarySyncFormHelpers"
import { PickLocationsSection } from "../../../plugins/common/PickLocationsSection"
import { TreeActionsSection } from "../../../plugins/common/TreeActionsSection"
import type { GoogleDriveLibrarySyncDocType } from "@oboku/shared"
import type {
  LibrarySyncFormData,
  LibrarySyncFormInternalProps,
} from "../../../plugins/types"

type GoogleDriveFormData = LibrarySyncFormData<{
  locations: string[]
}>

export const LibrarySyncForm = ({
  librarySync,
  onSubmit,
  submitLabel,
}: LibrarySyncFormInternalProps<GoogleDriveLibrarySyncDocType>) => {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { getGoogleScripts } = useGoogleScripts()
  const { control, handleSubmit } = useForm<GoogleDriveFormData>({
    mode: "onChange",
    defaultValues: {
      ...getLibrarySyncFormBaseDefaults(librarySync),
      locations: [...(librarySync?.data_v2?.items ?? [])],
    },
  })
  const {
    field: { onChange: setLocations, value: locations },
  } = useController({
    control,
    rules: { required: false },
    name: "locations",
  })
  const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
  const requestFilesAccess = useRequestFilesAccess({ requestPopup })
  const unmountSubject = useUnmountSubject()
  const { mutate: requestFilesAccessMutation } = useMutation$({
    mutationFn: () =>
      getGoogleScripts().pipe(
        switchMap(({ gapi }) => requestFilesAccess(gapi, locations)),
      ),
  })
  const createQuery = useCreateDriveFileQuery()
  const { pick } = useDrivePicker({
    requestPopup,
  })
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const queries = useQueries({
    queries: locations.map((id) => createQuery(id)),
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
    <LibrarySyncFormLayout
      control={control}
      onSubmit={handleSubmit((data) =>
        onSubmit(
          buildLibrarySyncSubmitPayload(data, { items: data.locations }),
        ),
      )}
      submitLabel={submitLabel}
    >
      <Stack
        sx={{
          gap: 2,
          overflow: "auto",
        }}
      >
        <PickLocationsSection
          locationsCount={locations.length}
          onAction={() => {
            pick({ select: "folder", multiSelect: true })
              .pipe(
                tap((data) => {
                  if (data.action === google.picker.Action.PICKED) {
                    const newData = [
                      ...locations,
                      ...(data.docs?.map((i) => i.id) ?? []),
                    ]

                    const newLocations = newData.reduce(
                      function reduceWithoutDuplicates(
                        acc: typeof newData,
                        locationId,
                      ) {
                        if (acc.find((entry) => entry === locationId)) {
                          return acc
                        }

                        return [...acc, locationId]
                      },
                      [],
                    )

                    setLocations(newLocations)
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
          resolveLocationsAccess={
            locations.length > 0 && hasMissingPermissions
              ? {
                  onAction: () => {
                    requestFilesAccessMutation()
                  },
                }
              : undefined
          }
        />
        <TreeActionsSection
          onRemoveSelectedLocations={() => {
            setSelectedLocationIds([])
            setLocations(
              locations.filter(
                (location) => !selectedLocationIds.includes(location),
              ),
            )
          }}
          selectedLocationsCount={selectedLocationIds.length}
        >
          <TreeView
            items={treeViewItems}
            selectedItems={selectedLocationIds}
            checkboxSelection
            onSelectedItemsChange={(_, itemIds) =>
              setSelectedLocationIds(itemIds)
            }
          />
        </TreeActionsSection>
      </Stack>
    </LibrarySyncFormLayout>
  )
}
