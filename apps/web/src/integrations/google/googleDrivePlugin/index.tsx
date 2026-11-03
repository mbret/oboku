/// <reference types="@types/gapi" />
/// <reference types="@types/gapi.client.drive-v3" />
/// <reference types="@types/google.accounts" />
/// <reference types="@types/google.picker" />
import { PLUGIN_NAME } from "./lib/constants"
import GoogleDriveAsset from "../../../assets/google-drive.svg?react"
import { SvgIcon } from "@mui/material"
import { UploadBook } from "./UploadBook"
import { DataSourceForm } from "./lib/DataSourceForm"
import { SelectItem as SelectItemComponent } from "./SelectItem"
import { getDataSourceLabel } from "./getDataSourceLabel"
import { Provider } from "./Provider"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../../plugins/types"
import { DownloadBook } from "./DownloadBook"
import { getFileIdLinkLabel } from "../../plugins/common/linkLabel"
import { UpsertFile } from "./UpsertFile"
import { clearGoogleAccessToken } from "../auth"
import { ROUTES } from "../../../navigation/routes"

const GoogleDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <GoogleDriveAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"DRIVE"> = {
  type: `DRIVE`,
  name: PLUGIN_NAME,
  canRemoveResource: false,
  canUpsertFile: true,
  upsertPrunesVersionHistory: true,
  Icon: GoogleDriveIcon,
  collectionIdentityFields: ["fileId"],
  featureFlag: "FEATURE_GOOGLE_DRIVE_ENABLED",
  integration: {
    name: "Google",
    description: "Manage contents from Google Drive",
    route: ROUTES.INTEGRATION_GOOGLE,
  },
  UploadBookComponent: UploadBook,
  canSynchronize: true,
  DownloadBookComponent: DownloadBook,
  UpsertFileComponent: UpsertFile,
  DataSourceForm,
  SelectItemComponent,
  getDataSourceLabel,
  getLinkLabel: getFileIdLinkLabel,
  useRefreshMetadata,
  useSynchronize,
  signOut: clearGoogleAccessToken,
  Provider,
}
