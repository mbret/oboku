/// <reference types="@types/gapi" />
/// <reference types="@types/gapi.client.drive-v3" />
/// <reference types="@types/google.accounts" />
/// <reference types="@types/google.picker" />
import { useUnsupportedRemoveResource } from "../../../plugins/common/useUnsupportedRemoveResource"
import { PLUGIN_NAME } from "./lib/constants"
import GoogleDriveAsset from "../../../assets/google-drive.svg?react"
import { SvgIcon } from "@mui/material"
import { UploadBook } from "./UploadBook"
import { DataSourceForm } from "./lib/DataSourceForm"
import { SelectItem as SelectItemComponent } from "./SelectItem"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { Provider } from "./Provider"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../../../plugins/types"
import { DownloadBook } from "./DownloadBook"
import { useFileIdLinkInfo as useLinkInfo } from "../../../plugins/common/linkInfo"
import { UpsertFile } from "./UpsertFile"
import { clearGoogleAccessToken } from "../auth"

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
  UploadBookComponent: UploadBook,
  canSynchronize: true,
  DownloadBookComponent: DownloadBook,
  UpsertFileComponent: UpsertFile,
  DataSourceForm,
  SelectItemComponent,
  useSyncSourceInfo,
  useLinkInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: function useGoogleDriveSignOut() {
    return clearGoogleAccessToken
  },
  Provider,
}
