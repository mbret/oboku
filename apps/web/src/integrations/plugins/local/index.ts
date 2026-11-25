import { SdStorageRounded } from "@mui/icons-material"
import type { SourcePlugin } from "../types"
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
import { useLibrarySyncInfo } from "./useLibrarySyncInfo"

export const plugin: SourcePlugin<"file"> = {
  type: PLUGIN_FILE_TYPE,
  name: "Local file",
  canRemoveResource: false,
  canSynchronize: false,
  UploadBookComponent: UploadBook,
  Icon: SdStorageRounded,
  useLinkInfo,
  useLibrarySyncInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  DownloadBookComponent: memo(function DownloadBook({ onError }) {
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
