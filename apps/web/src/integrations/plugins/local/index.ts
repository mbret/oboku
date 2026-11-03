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
import { useSynchronize } from "./useSynchronize"
import { getLinkLabel } from "./getLinkLabel"
import { getDataSourceLabel } from "./getDataSourceLabel"

export const plugin: ObokuPlugin<"file"> = {
  type: PLUGIN_FILE_TYPE,
  name: "file",
  canRemoveResource: false,
  canSynchronize: false,
  UploadBookComponent: UploadBook,
  Icon: SdStorageRounded,
  collectionIdentityFields: ["filename"],
  getLinkLabel,
  getDataSourceLabel,
  useRefreshMetadata,
  useSynchronize,
  signOut: function signOutOfLocalFiles() {},
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
