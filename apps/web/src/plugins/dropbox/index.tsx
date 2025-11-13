/// <reference types="@types/dropbox-chooser" />
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"
import { DataSourceForm } from "./DataSourceForm"
import { useDownloadBook } from "./useDownloadBook"
import DropboxIconAsset from "../../assets/dropbox.svg?react"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../types"
import { DataSourceDetails } from "./DataSourceDetails"
import { InfoScreen } from "./InfoScreen"
import { useSignOut } from "./useSignOut"

const DropboxIcon = () => (
  <SvgIcon>
    <DropboxIconAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin<"dropbox"> = {
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  type: `dropbox`,
  name: "Dropbox",
  Icon: DropboxIcon,
  UploadBookComponent: UploadBook,
  DataSourceDetails,
  DataSourceForm,
  useDownloadBook,
  useRemoveBook: undefined,
  useRefreshMetadata,
  useSynchronize,
  canSynchronize: true,
  InfoScreen,
  useSignOut,
  description: "Manage contents from Dropbox",
}
