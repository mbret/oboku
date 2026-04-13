import { useMutation } from "@tanstack/react-query"
import { memo } from "react"
import { useDelayEffect } from "../../../common/useDelayEffect"
import { useRequestPopupDialog } from "../../useRequestPopupDialog"
import { ONE_DRIVE_PLUGIN_NAME } from "../constants"
import { type OneDrivePickerSelection, PickerFrame } from "./PickerFrame"
import { requestOneDrivePickerLaunchData } from "./picker"

export type { OneDrivePickerSelection } from "./PickerFrame"

export const Picker = memo(function Picker({
  fileFilters,
  onClose,
  selectionMode,
  selectionPersistence,
}: {
  fileFilters?: readonly string[]
  onClose: (selections?: ReadonlyArray<OneDrivePickerSelection>) => void
  selectionMode?: "files" | "folders" | "all"
  selectionPersistence?: boolean
}) {
  const requestPopup = useRequestPopupDialog(ONE_DRIVE_PLUGIN_NAME)
  const { data, mutate } = useMutation({
    mutationFn: async () => requestOneDrivePickerLaunchData({ requestPopup }),
    onError: () => {
      onClose()
    },
  })

  useDelayEffect(mutate, 1)

  if (!data) return null

  return (
    <PickerFrame
      fileFilters={fileFilters}
      initialPickerAccessToken={data.initialPickerAccessToken}
      onClose={onClose}
      pickerBaseUrl={data.pickerBaseUrl}
      selectionMode={selectionMode}
      selectionPersistence={selectionPersistence}
    />
  )
})
