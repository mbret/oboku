import { DnsRounded } from "@mui/icons-material"
import { useUnsupportedRemoveResource } from "../../plugins/common/useUnsupportedRemoveResource"
import type { ObokuPlugin } from "../../plugins/types"
import { CONNECTOR, TYPE } from "./constants"
import { DataSourceForm } from "./DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { UploadBook } from "./UploadBook"
import { useFilePathLinkInfo as useLinkInfo } from "../../plugins/common/linkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
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
