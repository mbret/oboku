import type { ObokuPlugin } from "../../plugins/types"
import { useUnsupportedRemoveResource } from "../../plugins/common/useUnsupportedRemoveResource"
import { CONNECTOR, TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { useFilePathLinkInfo as useLinkInfo } from "../../plugins/common/linkInfo"
import { SvgIcon } from "@mui/material"
import WebDAVIconAsset from "../../../assets/webdav-icon.svg?react"
import { ConnectorForm } from "./connectors/ConnectorForm"

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
  collectionIdentityFields: ["connectorId", "filePath"],
  connector: {
    ...CONNECTOR,
    ConnectorForm,
  },
  integration: {
    name: "WebDAV",
    description: "Manage contents from WebDAV",
    route: CONNECTOR.integrationRoute,
  },
  DataSourceForm,
  UploadBookComponent: UploadBook,
  useSynchronize,
  useSyncSourceInfo,
  useLinkInfo,
  useRefreshMetadata,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {},
  DownloadBookComponent: DownloadBook,
}

export default plugin
