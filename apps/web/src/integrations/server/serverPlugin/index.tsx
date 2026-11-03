import { DnsRounded } from "@mui/icons-material"
import { rejectRemoveResource } from "../../plugins/common/rejectRemoveResource"
import type { ObokuPlugin } from "../../plugins/types"
import { CONNECTOR, TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { getFilePathLinkLabel } from "../../plugins/common/linkLabel"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { getDataSourceLabel } from "./getDataSourceLabel"
import { useSynchronize } from "./useSynchronize"
import { ConnectorForm } from "./connectors/ConnectorForm"

export const plugin: ObokuPlugin<"server"> = {
  type: TYPE,
  name: "Server",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: DnsRounded,
  collectionIdentityFields: ["connectorId", "filePath"],
  featureFlag: "FEATURE_SERVER_SYNC_ENABLED",
  connector: {
    ...CONNECTOR,
    ConnectorForm,
  },
  integration: {
    name: "Server",
    description: "Manage contents from your oboku server",
    route: CONNECTOR.integrationRoute,
  },
  getLinkLabel: getFilePathLinkLabel,
  getDataSourceLabel,
  useRefreshMetadata,
  useSynchronize,
  removeResource: rejectRemoveResource,
  signOut: function signOutOfServer() {},
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  DataSourceForm,
}
