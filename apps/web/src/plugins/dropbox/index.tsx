/// <reference types="@types/dropbox-chooser" />
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import { DataSourceForm } from "./DataSourceForm"
import DropboxIconAsset from "../../assets/dropbox.svg?react"
import { PLUGIN_NAME } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../types"
import { InfoScreen } from "./InfoScreen"
import { useSignOut } from "./useSignOut"
import { DownloadBook } from "./DownloadBook"
import { useLinkInfo } from "./useLinkInfo"
import { useSyncSourceInfo } from "./useSyncSourceInfo"

const DropboxIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <DropboxIconAsset />
  </SvgIcon>
)

const useRemoveBook: ObokuPlugin<"dropbox">["useRemoveBook"] = () => {
  return async () => {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}

export const plugin: ObokuPlugin<"dropbox"> = {
  type: `dropbox`,
  name: PLUGIN_NAME,
  canRemoveBook: false,
  Icon: DropboxIcon,
  UploadBookComponent: UploadBook,
  DataSourceCreateForm: (props) => (
    <DataSourceForm {...props} submitLabel="Confirm" />
  ),
  // The screen matches plugins by dataSource.type, guaranteeing the correct variant.
  DataSourceEditForm: ({ dataSource, ...rest }) => (
    <DataSourceForm
      {...rest}
      dataSource={dataSource as never}
      submitLabel="Save"
    />
  ),
  DownloadBookComponent: DownloadBook,
  useRemoveBook,
  useLinkInfo,
  useSyncSourceInfo,
  useRefreshMetadata,
  useSynchronize,
  canSynchronize: true,
  InfoScreen,
  useSignOut,
  description: "Manage contents from Dropbox",
}
