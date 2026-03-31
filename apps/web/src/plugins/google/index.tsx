/// <reference types="@types/gapi" />
/// <reference types="@types/gapi.client.drive-v3" />
/// <reference types="@types/google.accounts" />
/// <reference types="@types/google.picker" />
import { UnsupportedMethodError } from "../../errors/errors.shared"
import { PLUGIN_NAME } from "./lib/constants"
import GoogleDriveAsset from "../../assets/google-drive.svg?react"
import { SvgIcon } from "@mui/material"
import { UploadBook } from "./UploadBook"
import { DataSourceNew as DataSourceForm } from "./DataSourceNew"
import { SelectItem as SelectItemComponent } from "./SelectItem"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { Provider } from "./Provider"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../types"
import { InfoScreen } from "./InfoScreen"
import { DataSourceDetails } from "./DataSourceDetails"
import { DownloadBook } from "./DownloadBook"
import { useLinkInfo } from "./useLinkInfo"

const GoogleDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <GoogleDriveAsset />
  </SvgIcon>
)

const useRemoveBook: ObokuPlugin<"DRIVE">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}

export const plugin: ObokuPlugin<"DRIVE"> = {
  type: `DRIVE`,
  name: PLUGIN_NAME,
  canRemoveBook: false,
  Icon: GoogleDriveIcon,
  UploadBookComponent: UploadBook,
  canSynchronize: true,
  DownloadBookComponent: DownloadBook,
  DataSourceCreateForm: DataSourceForm,
  DataSourceEditForm: DataSourceDetails,
  SelectItemComponent,
  useSyncSourceInfo,
  useLinkInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveBook,
  useSignOut: () => () => {},
  Provider,
  InfoScreen,
  description: "Manage contents from Google Drive",
}
