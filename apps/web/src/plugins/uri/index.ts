import { HttpRounded } from "@mui/icons-material"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useDownloadBook } from "./useDownloadBook"
import type { ObokuPlugin } from "../types"
import { UploadBookComponent } from "./UploadBookComponent"

const plugin: ObokuPlugin<"URI"> = {
  type: TYPE,
  name: "uri",
  canSynchronize: false,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: HttpRounded,
  UploadBookComponent,
  useDownloadBook,
  description: "Manage books from URI / URL",
}

export default plugin
