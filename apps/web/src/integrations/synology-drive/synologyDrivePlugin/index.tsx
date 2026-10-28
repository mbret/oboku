import { SvgIcon } from "@mui/material"
import { PLUGIN_SYNOLOGY_DRIVE_TYPE } from "@oboku/shared"
import { useUnsupportedRemoveResource } from "../../plugins/common/useUnsupportedRemoveResource"
import type { ObokuPlugin } from "../../plugins/types"
import { UploadBook } from "./UploadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DownloadBook } from "./DownloadBook"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { useFileIdLinkInfo as useLinkInfo } from "../../plugins/common/linkInfo"
import iconSynologyDrive from "../../../assets/icon_synology_drive_01.png"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { clearSynologyDriveSession } from "./auth/auth"

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
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  DataSourceForm,
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: function useSynologyDriveSignOut() {
    return clearSynologyDriveSession
  },
}
