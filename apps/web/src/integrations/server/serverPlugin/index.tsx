import { DnsRounded } from "@mui/icons-material"
import { useUnsupportedRemoveResource } from "../../../plugins/common/useUnsupportedRemoveResource"
import type { ObokuPlugin } from "../../../plugins/types"
import { TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { useFilePathLinkInfo as useLinkInfo } from "../../../plugins/common/linkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { useSynchronize } from "./useSynchronize"

export const plugin: ObokuPlugin<"server"> = {
  type: TYPE,
  name: "Server",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: DnsRounded,
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  DataSourceForm,
}
