import { HttpRounded } from "@mui/icons-material"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"
import { ObokuPlugin } from "../plugin-front"

const plugin: ObokuPlugin = {
  type: TYPE,
  name: "Link",
  canSynchronize: false,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  Icon: HttpRounded,
  UploadComponent,
  useDownloadBook
}

export default plugin
