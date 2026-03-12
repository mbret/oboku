import type { ObokuPlugin } from "../types"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { InfoScreen } from "./InfoScreen"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DataSourceDetails } from "./DataSourceDetails"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"
import WebDAVIconAsset from "../../assets/webdav-icon.svg?react"

const WebDAVIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <WebDAVIconAsset />
  </SvgIcon>
)

const plugin: ObokuPlugin<"webdav"> = {
  type: TYPE,
  name: "WebDAV",
  canSynchronize: true,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: WebDAVIcon,
  description: "Manage contents from WebDAV",
  DataSourceForm,
  DataSourceDetails,
  UploadBookComponent: UploadBook,
  useSynchronize,
  useSyncSourceInfo,
  useRefreshMetadata,
  InfoScreen,
  DownloadBookComponent: DownloadBook,
}

export default plugin
