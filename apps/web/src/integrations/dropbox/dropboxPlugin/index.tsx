/// <reference types="@types/dropbox-chooser" />
import { UploadBook } from "./UploadBook"
import { SvgIcon } from "@mui/material"
import { rejectRemoveResource } from "../../plugins/common/rejectRemoveResource"
import { DataSourceForm } from "./DataSourceForm"
import DropboxIconAsset from "../../../assets/dropbox.svg?react"
import { PLUGIN_NAME } from "./constants"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import type { ObokuPlugin } from "../../plugins/types"
import { signOut } from "./signOut"
import { DownloadBook } from "./DownloadBook"
import { getFileIdLinkLabel } from "../../plugins/common/linkLabel"
import { getDataSourceLabel } from "./getDataSourceLabel"
import { UpsertFile } from "./UpsertFile"
import { ROUTES } from "../../../navigation/routes"

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
  collectionIdentityFields: ["fileId"],
  featureFlag: "FEATURE_DROPBOX_ENABLED",
  integration: {
    name: PLUGIN_NAME,
    description: "Manage contents from Dropbox",
    route: ROUTES.INTEGRATION_DROPBOX,
  },
  UploadBookComponent: UploadBook,
  DataSourceForm,
  DownloadBookComponent: DownloadBook,
  UpsertFileComponent: UpsertFile,
  removeResource: rejectRemoveResource,
  getLinkLabel: getFileIdLinkLabel,
  getDataSourceLabel,
  useRefreshMetadata,
  useSynchronize,
  canSynchronize: true,
  signOut,
}
