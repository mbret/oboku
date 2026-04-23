import { SvgIcon } from "@mui/material"
import { PLUGIN_SYNOLOGY_DRIVE_TYPE } from "@oboku/shared"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import type { ObokuPlugin } from "../types"
import { InfoScreen } from "./InfoScreen"
import { UploadBook } from "./UploadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { DownloadBook } from "./DownloadBook"
import { DataSourceForm } from "./DataSourceForm"
import { useSynchronize } from "./useSynchronize"
import { useLinkInfo } from "./useLinkInfo"
import iconSynologyDrive from "../../assets/icon_synology_drive_01.png"
import { useSyncSourceInfo } from "./useSyncSourceInfo"

const SynologyDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <image href={iconSynologyDrive} width="100%" height="100%" />
  </SvgIcon>
)

const useRemoveResource: ObokuPlugin<"synology-drive">["useRemoveResource"] =
  () => {
    return async () => {
      throw new UnsupportedMethodError("This data source cannot remove books")
    }
  }

export const plugin: ObokuPlugin<"synology-drive"> = {
  type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
  name: "Synology Drive",
  canRemoveResource: false,
  canSynchronize: true,
  Icon: SynologyDriveIcon,
  InfoScreen,
  UploadBookComponent: UploadBook,
  DownloadBookComponent: DownloadBook,
  DataSourceCreateForm: (props) => (
    <DataSourceForm {...props} submitLabel="Confirm" />
  ),
  DataSourceEditForm: ({ dataSource, ...rest }) => (
    <DataSourceForm {...rest} dataSource={dataSource} submitLabel="Save" />
  ),
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  useRemoveResource,
  useSignOut: () => () => {},
  description:
    "Browse a Synology Drive library and add books by stable file id",
}
