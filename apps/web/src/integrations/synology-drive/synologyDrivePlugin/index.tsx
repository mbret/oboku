import { SvgIcon } from "@mui/material"
import { PLUGIN_SYNOLOGY_DRIVE_TYPE } from "@oboku/shared"
import type { ObokuPlugin } from "../../plugins/types"
import { UploadBook } from "./UploadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DownloadBook } from "./DownloadBook"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { getFileIdLinkLabel } from "../../plugins/common/linkLabel"
import iconSynologyDrive from "../../../assets/icon_synology_drive_01.png"
import { getDataSourceLabel } from "./getDataSourceLabel"
import { clearSynologyDriveSession } from "./auth/auth"
import { ConnectorForm } from "./connectors/ConnectorForm"
import { CONNECTOR } from "./constants"

const SynologyDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <image href={iconSynologyDrive} width="100%" height="100%" />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"synology-drive"> = {
  type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
  name: "Synology Drive",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: SynologyDriveIcon,
  collectionIdentityFields: ["connectorId", "fileId"],
  connector: {
    ...CONNECTOR,
    ConnectorForm,
  },
  integration: {
    name: "Synology Drive",
    description:
      "Browse a Synology Drive library and add books by stable file id",
    route: CONNECTOR.integrationRoute,
  },
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  DataSourceForm,
  getLinkLabel: getFileIdLinkLabel,
  getDataSourceLabel,
  useRefreshMetadata,
  useSynchronize,
  useSignOut: function useSynologyDriveSignOut() {
    return clearSynologyDriveSession
  },
}
