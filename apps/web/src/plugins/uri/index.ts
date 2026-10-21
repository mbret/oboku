import { HttpRounded } from "@mui/icons-material"
import { createUnsupportedSynchronize } from "../common/createUnsupportedSynchronize"
import { useUnsupportedRemoveResource } from "../common/useUnsupportedRemoveResource"
import { TYPE } from "./constants"
import type { ObokuPlugin } from "../types"
import { UploadBookComponent } from "./UploadBookComponent"
import { DownloadBook } from "./DownloadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useLinkInfo } from "./useLinkInfo"
import { useSyncSourceInfo } from "./useSyncSourceInfo"

const plugin: ObokuPlugin<"URI"> = {
  type: TYPE,
  name: "uri",
  canRemoveResource: false,
  canSynchronize: false,
  Icon: HttpRounded,
  UploadBookComponent,
  DownloadBookComponent: DownloadBook,
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize: createUnsupportedSynchronize<"URI">(),
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  description: "Manage contents from URI / URL",
}

export default plugin
