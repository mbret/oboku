import { SdStorageRounded } from "@mui/icons-material"
import type { ObokuPlugin } from "../types"
import { UploadBook } from "./UploadBook"
import {
  ObokuErrorCode,
  ObokuSharedError,
  PLUGIN_FILE_TYPE,
} from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { memo, useEffect } from "react"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useLinkInfo } from "./useLinkInfo"
import { useSyncSourceInfo } from "./useSyncSourceInfo"

const useSynchronize: ObokuPlugin<"file">["useSynchronize"] = () => {
  return useMutation({
    mutationFn: async () => {
      throw new UnsupportedMethodError("This data source cannot synchronize")
    },
  })
}

const useRemoveBook: ObokuPlugin<"file">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}

export const plugin: ObokuPlugin<"file"> = {
  uniqueResourceIdentifier: "file",
  type: PLUGIN_FILE_TYPE,
  name: "file",
  canRemoveBook: false,
  canSynchronize: false,
  UploadBookComponent: UploadBook,
  Icon: SdStorageRounded,
  description: "Manage contents from your device (local)",
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveBook,
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
