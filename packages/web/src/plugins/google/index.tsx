import { UNIQUE_RESOURCE_IDENTIFIER } from "./lib/constants"
import GoogleDriveAsset from "../../assets/google-drive.svg?react"
import { SvgIcon } from "@mui/material"
import { UploadBook } from "./UploadBook"

import { useDownloadBook } from "./useDownloadBook"
import { useRemoveBook } from "./useRemoveBook"
import { GoogleDriveDataSource as AddDataSource } from "./GoogleDriveDataSource"
import { SelectItem as SelectItemComponent } from "./SelectItem"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { Provider } from "./Provider"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { ObokuPlugin } from "../types"
import { InfoScreen } from "./InfoScreen"

const GoogleDriveIcon = () => (
  <SvgIcon>
    <GoogleDriveAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  type: `DRIVE`,
  name: "Google Drive",
  Icon: GoogleDriveIcon,
  UploadBookComponent: UploadBook,
  canSynchronize: true,
  useDownloadBook,
  useRemoveBook,
  AddDataSource,
  SelectItemComponent,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  Provider,
  InfoScreen,
  description: "Manage books and collections from Google Drive"
}
