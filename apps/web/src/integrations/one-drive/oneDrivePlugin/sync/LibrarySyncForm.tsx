import { READER_ACCEPTED_EXTENSIONS, getOneDriveItemKey } from "@oboku/shared"
import { Stack } from "@mui/material"
import { memo, useCallback, useState } from "react"
import { useController, useForm } from "react-hook-form"
import { LibrarySyncFormLayout } from "../../../plugins/common/LibrarySyncFormLayout"
import {
  buildLibrarySyncSubmitPayload,
  getLibrarySyncFormBaseDefaults,
} from "../../../plugins/common/librarySyncFormHelpers"
import { PickItemsSection } from "../../../plugins/common/PickItemsSection"
import type {
  OneDriveLibrarySyncDocType,
  OneDriveLinkData,
} from "@oboku/shared"
import type {
  LibrarySyncFormData,
  LibrarySyncFormInternalProps,
} from "../../../plugins/types"
import { ONE_DRIVE_PLUGIN_NAME } from "../constants"
import { Picker, type OneDrivePickerSelection } from "../picker"
import { useRequestPopupDialog } from "../../../plugins/useRequestPopupDialog"
import { OneDriveTreeView } from "./OneDriveTreeView"
import { useLibrarySyncItems } from "./useLibrarySyncItems"
import { useRequestItemsAccess } from "./useRequestItemsAccess"

type OneDriveFormData = LibrarySyncFormData<{
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

export const LibrarySyncForm = memo(function LibrarySyncForm({
  librarySync,
  onSubmit,
  submitLabel,
}: LibrarySyncFormInternalProps<OneDriveLibrarySyncDocType>) {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control, handleSubmit } = useForm<OneDriveFormData>({
    mode: "onChange",
    defaultValues: {
      ...getLibrarySyncFormBaseDefaults(librarySync),
      items: [...(librarySync?.data_v2?.items ?? [])],
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
  const { driveItems, hasItemResolutionErrors } = useLibrarySyncItems({
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
      <LibrarySyncFormLayout
        control={control}
        onSubmit={handleSubmit((data) =>
          onSubmit(buildLibrarySyncSubmitPayload(data, { items: data.items })),
        )}
        submitLabel={submitLabel}
      >
        <Stack
          sx={{
            gap: 2,
            overflow: "auto",
          }}
        >
          <PickItemsSection
            locationsCount={items.length}
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
      </LibrarySyncFormLayout>
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
