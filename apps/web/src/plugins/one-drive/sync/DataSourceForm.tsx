import { READER_ACCEPTED_EXTENSIONS, getOneDriveItemKey } from "@oboku/shared"
import { Stack } from "@mui/material"
import { memo, useCallback, useState } from "react"
import { useController, useForm } from "react-hook-form"
import { DataSourceFormLayout } from "../../common/DataSourceFormLayout"
import {
  buildDataSourceSubmitPayload,
  getDataSourceFormBaseDefaults,
} from "../../common/dataSourceFormHelpers"
import { PickItemsSection } from "../../common/PickItemsSection"
import type { OneDriveDataSourceDocType, OneDriveLinkData } from "@oboku/shared"
import type {
  DataSourceFormData,
  DataSourceFormInternalProps,
} from "../../types"
import { ONE_DRIVE_PLUGIN_NAME } from "../constants"
import { Picker, type OneDrivePickerSelection } from "../picker"
import { useRequestPopupDialog } from "../../useRequestPopupDialog"
import { OneDriveTreeView } from "./OneDriveTreeView"
import { useDataSourceItems } from "./useDataSourceItems"
import { useRequestItemsAccess } from "./useRequestItemsAccess"

type OneDriveFormData = DataSourceFormData<{
  items: OneDriveLinkData[]
}>

function appendUniqueOneDriveItems(
  currentItems: readonly OneDriveLinkData[],
  nextItems: readonly OneDriveLinkData[],
) {
  const seen = new Set(currentItems.map(getOneDriveItemKey))

  return [
    ...currentItems,
    ...nextItems.filter(function isNewOneDriveItem(item) {
      const key = getOneDriveItemKey(item)

      if (seen.has(key)) {
        return false
      }

      seen.add(key)

      return true
    }),
  ]
}

export const DataSourceForm = memo(function DataSourceForm({
  dataSource,
  onSubmit,
  submitLabel,
}: DataSourceFormInternalProps<OneDriveDataSourceDocType>) {
  const { control, handleSubmit } = useForm<OneDriveFormData>({
    mode: "onChange",
    defaultValues: {
      ...getDataSourceFormBaseDefaults(dataSource),
      items: [...(dataSource?.data_v2?.items ?? [])],
    },
  })
  const {
    field: { onChange: setItems, value: items = [] },
  } = useController({
    control,
    name: "items",
    rules: { required: false },
  })
  const requestPopup = useRequestPopupDialog(ONE_DRIVE_PLUGIN_NAME)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const { mutate: requestItemsAccess, isPending: isRequestingItemsAccess } =
    useRequestItemsAccess({
      requestPopup,
    })
  const { driveItems, hasItemResolutionErrors } = useDataSourceItems({
    items,
  })

  const handlePickerClose = useCallback(
    (selections?: ReadonlyArray<OneDrivePickerSelection>) => {
      setIsPickerOpen(false)

      if (!selections?.length) {
        return
      }

      setItems(
        appendUniqueOneDriveItems(
          items,
          selections.map(
            (item): OneDriveLinkData => ({
              driveId: item.parentReference.driveId,
              fileId: item.id,
            }),
          ),
        ),
      )
    },
    [items, setItems],
  )

  return (
    <>
      <DataSourceFormLayout
        control={control}
        onSubmit={handleSubmit((data) =>
          onSubmit(buildDataSourceSubmitPayload(data, { items: data.items })),
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
            onAction={() => setIsPickerOpen(true)}
            resolveItemsAccess={
              hasItemResolutionErrors
                ? {
                    isLoading: isRequestingItemsAccess,
                    onAction: () => {
                      requestItemsAccess()
                    },
                  }
                : undefined
            }
            variant="outlined"
          />
          <OneDriveTreeView
            items={items}
            driveItems={driveItems}
            onItemsChange={setItems}
          />
        </Stack>
      </DataSourceFormLayout>
      {isPickerOpen && (
        <Picker
          fileFilters={READER_ACCEPTED_EXTENSIONS}
          onClose={handlePickerClose}
          selectionMode="all"
          selectionPersistence
        />
      )}
    </>
  )
})
