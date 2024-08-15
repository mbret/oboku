import { HttpRounded } from "@mui/icons-material"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"
import { ObokuPlugin } from "../types"

const plugin: ObokuPlugin = {
  type: TYPE,
  name: "link",
  canSynchronize: false,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: HttpRounded,
  UploadComponent,
  useDownloadBook,
  description: "Manage books from URI / URL"
}

export default plugin
