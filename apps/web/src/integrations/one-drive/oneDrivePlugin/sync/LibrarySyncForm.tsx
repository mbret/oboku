import { READER_ACCEPTED_EXTENSIONS, getOneDriveItemKey } from "@oboku/shared"
import { Stack } from "@mui/material"
import { memo, useCallback, useState } from "react"
import { useController, useForm } from "react-hook-form"
import { LibrarySyncFormLayout } from "../../../plugins/common/LibrarySyncFormLayout"
import {
  buildLibrarySyncSubmitPayload,
  getLibrarySyncFormBaseDefaults,
} from "../../../plugins/common/librarySyncFormHelpers"
import { PickLocationsSection } from "../../../plugins/common/PickLocationsSection"
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
import { useLibrarySyncLocations } from "./useLibrarySyncLocations"
import { useRequestLocationsAccess } from "./useRequestLocationsAccess"

type OneDriveFormData = LibrarySyncFormData<{
  locations: OneDriveLinkData[]
}>

function appendUniqueLocations(
  currentLocations: readonly OneDriveLinkData[],
  nextLocations: readonly OneDriveLinkData[],
) {
  const seen = new Set(currentLocations.map(getOneDriveItemKey))

  return [
    ...currentLocations,
    ...nextLocations.filter(function isNewLocation(location) {
      const key = getOneDriveItemKey(location)

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
      locations: [...(librarySync?.data_v2?.items ?? [])],
    },
  })
  const {
    field: { onChange: setLocations, value: locations = [] },
  } = useController({
    control,
    name: "locations",
    rules: { required: false },
  })
  const requestPopup = useRequestPopupDialog(ONE_DRIVE_PLUGIN_NAME)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const {
    mutate: requestLocationsAccess,
    isPending: isRequestingLocationsAccess,
  } = useRequestLocationsAccess({
    requestPopup,
  })
  const { driveItems, hasLocationResolutionErrors } = useLibrarySyncLocations({
    locations,
  })

  const handlePickerClose = useCallback(
    (selections?: ReadonlyArray<OneDrivePickerSelection>) => {
      setIsPickerOpen(false)

      if (!selections?.length) {
        return
      }

      setLocations(
        appendUniqueLocations(
          locations,
          selections.map(
            (selection): OneDriveLinkData => ({
              driveId: selection.parentReference.driveId,
              fileId: selection.id,
            }),
          ),
        ),
      )
    },
    [locations, setLocations],
  )

  return (
    <>
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
            onAction={() => setIsPickerOpen(true)}
            resolveLocationsAccess={
              hasLocationResolutionErrors
                ? {
                    isLoading: isRequestingLocationsAccess,
                    onAction: () => {
                      requestLocationsAccess()
                    },
                  }
                : undefined
            }
            variant="outlined"
          />
          <OneDriveTreeView
            locations={locations}
            driveItems={driveItems}
            onLocationsChange={setLocations}
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
