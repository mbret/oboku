import type { ObokuPlugin } from "../types"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import { TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { InfoScreen } from "./InfoScreen"
import { useRefreshMetadata } from "./useRefreshMetadata"
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

const useRemoveResource: ObokuPlugin<"webdav">["useRemoveResource"] = () => {
  return async () => {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}

const plugin: ObokuPlugin<"webdav"> = {
  type: TYPE,
  name: "WebDAV",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: WebDAVIcon,
  description: "Manage contents from WebDAV",
  DataSourceCreateForm: (props) => (
    <DataSourceForm {...props} submitLabel="Confirm" />
  ),
  DataSourceEditForm: ({ dataSource, ...rest }) => (
    <DataSourceForm {...rest} dataSource={dataSource} submitLabel="Save" />
  ),
  UploadBookComponent: UploadBook,
  useSynchronize,
  useSyncSourceInfo,
  useLinkInfo,
  useRefreshMetadata,
  useRemoveResource,
  useSignOut: () => () => {},
  InfoScreen,
  DownloadBookComponent: DownloadBook,
}

export default plugin
