import { HttpRounded } from "@mui/icons-material"
import { ObokuPlugin } from "@oboku/plugin-front"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"

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
