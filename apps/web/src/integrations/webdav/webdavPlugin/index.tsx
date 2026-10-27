import type { ObokuPlugin } from "../../../plugins/types"
import { useUnsupportedRemoveResource } from "../../../plugins/common/useUnsupportedRemoveResource"
import { TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { InfoScreen } from "./InfoScreen"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { useFilePathLinkInfo as useLinkInfo } from "../../../plugins/common/linkInfo"
import { SvgIcon } from "@mui/material"
import WebDAVIconAsset from "../../../assets/webdav-icon.svg?react"

const WebDAVIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <WebDAVIconAsset />
  </SvgIcon>
)

const plugin: ObokuPlugin<"webdav"> = {
  type: TYPE,
  name: "WebDAV",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: WebDAVIcon,
  description: "Manage contents from WebDAV",
  DataSourceForm,
  UploadBookComponent: UploadBook,
  useSynchronize,
  useSyncSourceInfo,
  useLinkInfo,
  useRefreshMetadata,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  InfoScreen,
  DownloadBookComponent: DownloadBook,
}

export default plugin
