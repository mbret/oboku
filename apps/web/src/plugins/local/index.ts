import { SdStorageRounded } from "@mui/icons-material"
import type { ObokuPlugin } from "../types"
import { UploadBook } from "./UploadBook"
import {
  ObokuErrorCode,
  ObokuSharedError,
  PLUGIN_FILE_TYPE,
} from "@oboku/shared"
import { memo, useEffect } from "react"
import { useRefreshMetadata } from "./useRefreshMetadata"

export const plugin: ObokuPlugin<"file"> = {
  uniqueResourceIdentifier: "file",
  type: PLUGIN_FILE_TYPE,
  name: "file",
  UploadBookComponent: UploadBook,
  Icon: SdStorageRounded,
  description: "Manage contents from your device (local)",
  useRefreshMetadata,
  DownloadBookComponent: memo(({ onError }) => {
    useEffect(() => {
      onError(
        new ObokuSharedError(
          ObokuErrorCode.ERROR_DATASOURCE_DOWNLOAD_DIFFERENT_DEVICE,
        ),
      )
    }, [onError])

    return null
  }),
}
