import { HttpRounded } from "@mui/icons-material"
import { TYPE } from "./constants"
import type { ObokuPlugin } from "../types"
import { UploadBookComponent } from "./UploadBookComponent"
import { DownloadBook } from "./DownloadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"
import { useSynchronize } from "./useSynchronize"
import { getLinkLabel } from "./getLinkLabel"
import { getDataSourceLabel } from "./getDataSourceLabel"

const plugin: ObokuPlugin<"URI"> = {
  type: TYPE,
  name: "uri",
  canRemoveResource: false,
  canSynchronize: false,
  Icon: HttpRounded,
  collectionIdentityFields: ["url"],
  UploadBookComponent,
  DownloadBookComponent: DownloadBook,
  getLinkLabel,
  getDataSourceLabel,
  useRefreshMetadata,
  useSynchronize,
  signOut: function signOutOfUrls() {},
}

export default plugin
