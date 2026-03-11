import { SvgIcon } from "@mui/material"
import {
  PLUGIN_SYNOLOGY_DRIVE_TYPE,
  UNIQUE_RESOURCE_IDENTIFIER,
} from "@oboku/shared"
import type { ObokuPlugin } from "../types"
import { InfoScreen } from "./InfoScreen"
import { UploadBook } from "./UploadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DownloadBook } from "./DownloadBook"
import iconSynologyDrive from "../../assets/icon_synology_drive_01.png"

const SynologyDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <image href={iconSynologyDrive} width="100%" height="100%" />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"synology-drive"> = {
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
  name: "Synology Drive",
  Icon: SynologyDriveIcon,
  InfoScreen,
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  useRefreshMetadata,
  description:
    "Browse a Synology Drive library and add books by stable file id",
}
