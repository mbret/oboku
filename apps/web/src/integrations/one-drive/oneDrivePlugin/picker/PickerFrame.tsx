import { Dialog, IconButton, Stack } from "@mui/material"
import { CloseRounded } from "@mui/icons-material"
import { useMutation } from "@tanstack/react-query"
import { memo, useEffect, useState } from "react"
import { LockScreen } from "../../../../common/locks/LockScreen"
import { pickOneDriveItemsWithPicker, type OneDrivePickerItem } from "./picker"

export type OneDrivePickerSelection = OneDrivePickerItem & {
  id: string
  name: string
  parentReference: {
    driveId: string
  }
}

function isOneDrivePickerSelection(
  item: OneDrivePickerItem,
): item is OneDrivePickerSelection {
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.parentReference?.driveId === "string"
  )
}

export const PickerFrame = memo(function PickerFrame({
  fileFilters,
  initialPickerAccessToken,
  onClose,
  pickerBaseUrl,
  selectionMode,
  selectionPersistence,
}: {
  fileFilters?: readonly string[]
  initialPickerAccessToken: string
  onClose: (selections?: ReadonlyArray<OneDrivePickerSelection>) => void
  pickerBaseUrl: string
  selectionMode?: "files" | "folders" | "all"
  selectionPersistence?: boolean
}) {
  const [iframeName] = useState(function createIframeName() {
    return `one-drive-picker-${crypto.randomUUID()}`
  })
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  function closeWithoutSelection() {
    onClose()
  }

  const { mutate } = useMutation({
    mutationFn: async function pickSelectionsInIframe({
      iframe: iframeEl,
      signal,
    }: {
      iframe: HTMLIFrameElement
      signal: AbortSignal
    }) {
      const selectedItems = await pickOneDriveItemsWithPicker({
        baseUrl: pickerBaseUrl,
        fileFilters,
        iframe: iframeEl,
        initialAccessToken: initialPickerAccessToken,
        locale: navigator.language.toLowerCase(),
        selectionMode,
        selectionPersistence,
        signal,
      })

      const validSelections = selectedItems.filter(isOneDrivePickerSelection)

      return validSelections
    },
    onSuccess: function closeWithSelections(selections) {
      onClose(selections)
    },
    onError: closeWithoutSelection,
  })

  useEffect(
    function startPickerOnceIframeMounts() {
      if (!iframe) {
        return
      }

      const abortController = new AbortController()

      mutate({ iframe, signal: abortController.signal })

      return function abortPicker() {
        abortController.abort()
      }
    },
    [iframe, mutate],
  )

  return (
    <Dialog fullScreen onClose={closeWithoutSelection} open>
      {!isPageLoaded && <LockScreen />}
      <Stack
        sx={{
          height: "100%",
          minHeight: 0,
          position: "relative",
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={closeWithoutSelection}
          size="small"
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 1,
          }}
        >
          <CloseRounded />
        </IconButton>
        <iframe
          ref={setIframe}
          name={iframeName}
          onLoad={function markPageAsLoaded() {
            setIsPageLoaded(true)
          }}
          style={{
            border: 0,
            display: "block",
            flex: 1,
            minHeight: 0,
            width: "100%",
          }}
          title="OneDrive picker"
        />
      </Stack>
    </Dialog>
  )
})
