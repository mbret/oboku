/// <reference types="@types/gapi" />
/// <reference types="@types/gapi.client.drive-v3" />
/// <reference types="@types/google.accounts" />
/// <reference types="@types/google.picker" />
import { PLUGIN_NAME, UNIQUE_RESOURCE_IDENTIFIER } from "./lib/constants"
import GoogleDriveAsset from "../../assets/google-drive.svg?react"
import { SvgIcon } from "@mui/material"
import { UploadBook } from "./UploadBook"
import { useDownloadBook } from "./useDownloadBook"
import { GoogleDriveDataSource as AddDataSource } from "./GoogleDriveDataSource"
import { SelectItem as SelectItemComponent } from "./SelectItem"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { Provider } from "./Provider"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../types"
import { InfoScreen } from "./InfoScreen"
import { DataSourceDetails } from "./DataSourceDetails"

const GoogleDriveIcon = () => (
  <SvgIcon>
    <GoogleDriveAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"DRIVE"> = {
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  type: `DRIVE`,
  name: PLUGIN_NAME,
  Icon: GoogleDriveIcon,
  UploadBookComponent: UploadBook,
  canSynchronize: true,
  useDownloadBook,
  AddDataSource,
  DataSourceDetails,
  SelectItemComponent,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  Provider,
  InfoScreen,
  description: "Manage contents from Google Drive",
}
