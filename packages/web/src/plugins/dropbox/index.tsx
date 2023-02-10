import { ObokuPlugin } from "@oboku/plugin-front"
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"

import { AddDataSource } from "./AddDataSource"
import { useDownloadBook } from "./useDownloadBook"
import { ReactComponent as DropboxIconAsset } from "../../assets/dropbox.svg"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"

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
  synchronizable: true
}
