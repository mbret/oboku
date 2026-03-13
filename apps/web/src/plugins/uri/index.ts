import { HttpRounded } from "@mui/icons-material"
import { useMutation } from "@tanstack/react-query"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import type { ObokuPlugin } from "../types"
import { UploadBookComponent } from "./UploadBookComponent"
import { DownloadBook } from "./DownloadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useLinkInfo } from "./useLinkInfo"
import { useSyncSourceInfo } from "./useSyncSourceInfo"

const useSynchronize: ObokuPlugin<"URI">["useSynchronize"] = () => {
  return useMutation({
    mutationFn: async () => {
      throw new UnsupportedMethodError("This data source cannot synchronize")
    },
  })
}

const useRemoveBook: ObokuPlugin<"URI">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}

const plugin: ObokuPlugin<"URI"> = {
  type: TYPE,
  name: "uri",
  canRemoveBook: false,
  canSynchronize: false,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: HttpRounded,
  UploadBookComponent,
  DownloadBookComponent: DownloadBook,
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveBook,
  useSignOut: () => () => {},
  description: "Manage contents from URI / URL",
}

export default plugin
