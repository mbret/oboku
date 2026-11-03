import { PLUGIN_ONE_DRIVE_TYPE } from "@oboku/shared"
import OneDriveAsset from "../../../assets/Microsoft_OneDrive_Icon_2025_-_present.svg?react"
import type { ObokuPlugin } from "../../plugins/types"
import { clearOneDriveSession } from "./auth/auth"
import { DataSourceForm } from "./sync/DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { Provider } from "./Provider"
import { UploadBook } from "./UploadBook"
import { UpsertFile } from "./UpsertFile"
import { getFileIdLinkLabel } from "../../plugins/common/linkLabel"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { getDataSourceLabel } from "./getDataSourceLabel"
import { SvgIcon } from "@mui/material"
import { ROUTES } from "../../../navigation/routes"

const OneDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <OneDriveAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"one-drive"> = {
  canSynchronize: true,
  canUpsertFile: true,
  canRemoveResource: false,
  DataSourceForm,
  DownloadBookComponent: DownloadBook,
  Icon: OneDriveIcon,
  collectionIdentityFields: ["driveId", "fileId"],
  featureFlag: "FEATURE_ONE_DRIVE_ENABLED",
  integration: {
    name: "OneDrive",
    description: "Manage contents from Microsoft OneDrive",
    route: ROUTES.INTEGRATION_ONE_DRIVE,
  },
  name: "OneDrive",
  Provider,
  type: PLUGIN_ONE_DRIVE_TYPE,
  UploadBookComponent: UploadBook,
  UpsertFileComponent: UpsertFile,
  getLinkLabel: getFileIdLinkLabel,
  useRefreshMetadata,
  signOut: function signOutOfOneDrive() {
    void clearOneDriveSession()
  },
  useSynchronize,
  getDataSourceLabel,
}
