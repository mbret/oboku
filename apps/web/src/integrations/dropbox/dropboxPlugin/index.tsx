/// <reference types="@types/dropbox-chooser" />
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"
import { useUnsupportedRemoveResource } from "../../plugins/common/useUnsupportedRemoveResource"
import { LibrarySyncForm } from "./LibrarySyncForm"
import DropboxIconAsset from "../../../assets/dropbox.svg?react"
import { PLUGIN_NAME } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { SourcePlugin } from "../../plugins/types"
import { useSignOut } from "./useSignOut"
import { DownloadBook } from "./DownloadBook"
import { useFileIdLinkInfo as useLinkInfo } from "../../plugins/common/linkInfo"
import { useLibrarySyncInfo } from "./useLibrarySyncInfo"
import { UpsertFile } from "./UpsertFile"

const DropboxIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <DropboxIconAsset />
  </SvgIcon>
)

export const plugin: SourcePlugin<"dropbox"> = {
  type: `dropbox`,
  name: PLUGIN_NAME,
  canRemoveResource: false,
  canUpsertFile: true,
  Icon: DropboxIcon,
  UploadBookComponent: UploadBook,
  LibrarySyncForm,
  DownloadBookComponent: DownloadBook,
  UpsertFileComponent: UpsertFile,
  useRemoveResource: useUnsupportedRemoveResource,
  useLinkInfo,
  useLibrarySyncInfo,
  useRefreshMetadata,
  useSynchronize,
  canSynchronize: true,
  useSignOut,
}
