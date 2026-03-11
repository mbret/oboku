/// <reference types="@types/dropbox-chooser" />
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"
import { DataSourceForm } from "./DataSourceForm"
import DropboxIconAsset from "../../assets/dropbox.svg?react"
import { PLUGIN_NAME, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../types"
import { DataSourceDetails } from "./DataSourceDetails"
import { InfoScreen } from "./InfoScreen"
import { useSignOut } from "./useSignOut"
import { DownloadBook } from "./DownloadBook"

const DropboxIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <DropboxIconAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"dropbox"> = {
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  type: `dropbox`,
  name: PLUGIN_NAME,
  Icon: DropboxIcon,
  UploadBookComponent: UploadBook,
  DataSourceDetails,
  DataSourceForm,
  DownloadBookComponent: DownloadBook,
  useRemoveBook: undefined,
  useRefreshMetadata,
  useSynchronize,
  canSynchronize: true,
  InfoScreen,
  useSignOut,
  description: "Manage contents from Dropbox",
}
