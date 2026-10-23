/// <reference types="@types/dropbox-chooser" />
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"
import { useUnsupportedRemoveResource } from "../common/useUnsupportedRemoveResource"
import { DataSourceForm } from "./DataSourceForm"
import DropboxIconAsset from "../../assets/dropbox.svg?react"
import { PLUGIN_NAME } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../types"
import { InfoScreen } from "./InfoScreen"
import { useSignOut } from "./useSignOut"
import { DownloadBook } from "./DownloadBook"
import { useFileIdLinkInfo as useLinkInfo } from "../common/linkInfo"
import { useSyncSourceInfo } from "./useSyncSourceInfo"
import { UpsertFile } from "./UpsertFile"

const DropboxIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <DropboxIconAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"dropbox"> = {
  type: `dropbox`,
  name: PLUGIN_NAME,
  canRemoveResource: false,
  canUpsertFile: true,
  Icon: DropboxIcon,
  UploadBookComponent: UploadBook,
  DataSourceForm,
  DownloadBookComponent: DownloadBook,
  UpsertFileComponent: UpsertFile,
  useRemoveResource: useUnsupportedRemoveResource,
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  canSynchronize: true,
  InfoScreen,
  useSignOut,
  description: "Manage contents from Dropbox",
}
