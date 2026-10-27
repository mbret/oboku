import { PLUGIN_ONE_DRIVE_TYPE } from "@oboku/shared"
import { useUnsupportedRemoveResource } from "../../../plugins/common/useUnsupportedRemoveResource"
import OneDriveAsset from "../../../assets/Microsoft_OneDrive_Icon_2025_-_present.svg?react"
import type { ObokuPlugin } from "../../../plugins/types"
import { clearOneDriveSession } from "./auth/auth"
import { DataSourceForm } from "./sync/DataSourceForm"
import { DownloadBook } from "./DownloadBook"
import { Provider } from "./Provider"
import { InfoScreen } from "./InfoScreen"
import { UploadBook } from "./UploadBook"
import { UpsertFile } from "./UpsertFile"
import { useFileIdLinkInfo as useLinkInfo } from "../../../plugins/common/linkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { SvgIcon } from "@mui/material"

const OneDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <OneDriveAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"one-drive"> = {
  canSynchronize: true,
  canUpsertFile: true,
  canRemoveResource: false,
  description: "Manage contents from Microsoft OneDrive",
  DataSourceForm,
  DownloadBookComponent: DownloadBook,
  Icon: OneDriveIcon,
  name: "OneDrive",
  Provider,
  type: PLUGIN_ONE_DRIVE_TYPE,
  UploadBookComponent: UploadBook,
  UpsertFileComponent: UpsertFile,
  InfoScreen,
  useLinkInfo,
  useRefreshMetadata,
  useRemoveResource: useUnsupportedRemoveResource,
  useSignOut: () => () => {
    void clearOneDriveSession()
  },
  useSynchronize,
  useSyncSourceInfo,
}
