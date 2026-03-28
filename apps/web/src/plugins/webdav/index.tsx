import type { ObokuPlugin } from "../types"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import { TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { InfoScreen } from "./InfoScreen"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DataSourceDetails } from "./DataSourceDetails"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { useLinkInfo } from "./useLinkInfo"
import { SvgIcon } from "@mui/material"
import WebDAVIconAsset from "../../assets/webdav-icon.svg?react"

const WebDAVIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <WebDAVIconAsset />
  </SvgIcon>
)

const useRemoveBook: ObokuPlugin<"webdav">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}

const plugin: ObokuPlugin<"webdav"> = {
  type: TYPE,
  name: "WebDAV",
  canRemoveBook: false,
  canSynchronize: true,
  Icon: WebDAVIcon,
  description: "Manage contents from WebDAV",
  DataSourceForm,
  DataSourceDetails,
  UploadBookComponent: UploadBook,
  useSynchronize,
  useSyncSourceInfo,
  useLinkInfo,
  useRefreshMetadata,
  useRemoveBook,
  useSignOut: () => () => {},
  InfoScreen,
  DownloadBookComponent: DownloadBook,
}

export default plugin
