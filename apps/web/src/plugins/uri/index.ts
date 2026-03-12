import { HttpRounded } from "@mui/icons-material"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import type { ObokuPlugin } from "../types"
import { UploadBookComponent } from "./UploadBookComponent"
import { DownloadBook } from "./DownloadBook"
import { useRefreshMetadata } from "./useRefreshMetadata"

const plugin: ObokuPlugin<"URI"> = {
  type: TYPE,
  name: "uri",
  canSynchronize: false,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: HttpRounded,
  UploadBookComponent,
  DownloadBookComponent: DownloadBook,
  useRefreshMetadata,
  description: "Manage contents from URI / URL",
}

export default plugin
