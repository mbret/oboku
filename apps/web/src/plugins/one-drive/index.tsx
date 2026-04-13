import { PLUGIN_ONE_DRIVE_TYPE } from "@oboku/shared"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import OneDriveAsset from "../../assets/Microsoft_OneDrive_Icon_2025_-_present.svg?react"
import type { ObokuPlugin } from "../types"
import { clearOneDriveSession } from "./auth/auth"
import { DataSourceCreateForm } from "./DataSourceCreateForm"
import { DataSourceEditForm } from "./DataSourceEditForm"
import { DownloadBook } from "./DownloadBook"
import { Provider } from "./Provider"
import { InfoScreen } from "./InfoScreen"
import { UploadBook } from "./UploadBook"
import { useLinkInfo } from "./useLinkInfo"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { SvgIcon } from "@mui/material"

const OneDriveIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <OneDriveAsset />
  </SvgIcon>
)

const useRemoveBook: ObokuPlugin<"one-drive">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}

export const plugin: ObokuPlugin<"one-drive"> = {
  canSynchronize: true,
  canRemoveBook: false,
  description: "Manage contents from Microsoft OneDrive",
  DataSourceCreateForm,
  DataSourceEditForm,
  DownloadBookComponent: DownloadBook,
  Icon: OneDriveIcon,
  name: "OneDrive",
  Provider,
  type: PLUGIN_ONE_DRIVE_TYPE,
  UploadBookComponent: UploadBook,
  InfoScreen,
  useLinkInfo,
  useRefreshMetadata,
  useRemoveBook,
  useSignOut: () => () => {
    void clearOneDriveSession()
  },
  useSynchronize,
  useSyncSourceInfo,
}
