import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"

import { AddDataSource } from "./AddDataSource"
import { useDownloadBook } from "./useDownloadBook"
import DropboxIconAsset from "../../assets/dropbox.svg?react"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { ObokuPlugin } from "../plugin-front"

const DropboxIcon = () => (
  <SvgIcon>
    <DropboxIconAsset />
  </SvgIcon>
)

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  type: `dropbox`,
  name: "Dropbox",
  Icon: DropboxIcon,
  UploadComponent: UploadBook,
  AddDataSource,
  useDownloadBook,
  useRemoveBook: undefined,
  useRefreshMetadata,
  useSynchronize,
  canSynchronize: true
}
