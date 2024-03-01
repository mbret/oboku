import { SdStorageRounded } from "@mui/icons-material"
import { ObokuPlugin } from "../plugin-front"
import { UploadBook } from "./UploadBook"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: "file",
  type: PLUGIN_FILE_TYPE,
  name: "File",
  UploadComponent: UploadBook,
  Icon: SdStorageRounded
}
