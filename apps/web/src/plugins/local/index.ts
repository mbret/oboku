import { SdStorageRounded } from "@mui/icons-material"
import type { ObokuPlugin } from "../types"
import { UploadBook } from "./UploadBook"
import {
  ObokuErrorCode,
  ObokuSharedError,
  PLUGIN_FILE_TYPE,
} from "@oboku/shared"
import { memo, useEffect } from "react"
import { useUnsupportedRemoveResource } from "../common/useUnsupportedRemoveResource"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { useLinkInfo } from "./useLinkInfo"
import { useSyncSourceInfo } from "./useSyncSourceInfo"

export const plugin: ObokuPlugin<"file"> = {
  type: PLUGIN_FILE_TYPE,
  name: "file",
  canRemoveResource: false,
  canSynchronize: false,
  UploadBookComponent: UploadBook,
  Icon: SdStorageRounded,
  description: "Manage contents from your device (local)",
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
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
