import { Dialog, IconButton, Stack } from "@mui/material"
import { CloseRounded } from "@mui/icons-material"
import { useMutation } from "@tanstack/react-query"
import { memo, useEffect, useRef, useState } from "react"
import { LockScreen } from "../../../common/locks/LockScreen"
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

export const Picker = memo(function Picker({
  fileFilters,
  initialPickerAccessToken,
  onClose,
  pickerBaseUrl,
}: {
  fileFilters?: readonly string[]
  initialPickerAccessToken: string
  onClose: (selections?: ReadonlyArray<OneDrivePickerSelection>) => void
  pickerBaseUrl: string
}) {
  const iframeNameRef = useRef(`one-drive-picker-${crypto.randomUUID()}`)
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  const { mutate } = useMutation({
    mutationFn: async ({
      iframe: iframeEl,
      signal,
    }: {
      iframe: HTMLIFrameElement
      signal: AbortSignal
    }) => {
      const selectedItems = await pickOneDriveItemsWithPicker({
        baseUrl: pickerBaseUrl,
        fileFilters,
        iframe: iframeEl,
        initialAccessToken: initialPickerAccessToken,
        locale: navigator.language.toLowerCase(),
        signal,
      })

      const validSelections = selectedItems.filter(isOneDrivePickerSelection)

      return validSelections
    },
    onSuccess: (selections) => onClose(selections),
    onError: () => onClose(),
  })

  useEffect(() => {
    if (!iframe) {
      return
    }

    const abortController = new AbortController()

    mutate({ iframe, signal: abortController.signal })

    return () => abortController.abort()
  }, [iframe, mutate])

  return (
    <Dialog fullScreen onClose={() => onClose()} open>
      {!isPageLoaded && <LockScreen />}
      <Stack height="100%" minHeight={0} position="relative">
        <IconButton
          onClick={() => onClose()}
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
          name={iframeNameRef.current}
          onLoad={() => setIsPageLoaded(true)}
          style={{
            border: 0,
            display: "block",
            flex: 1,
            minHeight: 0,
            width: "100%",
          }}
          title="OneDrive file picker"
        />
      </Stack>
    </Dialog>
  )
})
