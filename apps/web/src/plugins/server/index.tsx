import { DnsRounded } from "@mui/icons-material"
import { useUnsupportedRemoveResource } from "../common/useUnsupportedRemoveResource"
import type { ObokuPlugin } from "../types"
import { TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { InfoScreen } from "./InfoScreen"
import { UploadBook } from "./UploadBook"
import { useFilePathLinkInfo as useLinkInfo } from "../common/linkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { useSynchronize } from "./useSynchronize"

export const plugin: ObokuPlugin<"server"> = {
  type: TYPE,
  name: "Server",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: DnsRounded,
  description: "Manage contents from your oboku server",
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  DataSourceForm,
  InfoScreen: () => <InfoScreen />,
}
