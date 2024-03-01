import { SdStorageRounded } from "@mui/icons-material"
import { ObokuPlugin } from "../plugin-front"
import { UploadBook } from "./UploadBook"

export const PLUGIN_FILE_TYPE = "file"

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: "file",
  type: PLUGIN_FILE_TYPE,
  name: "File",
  UploadComponent: UploadBook,
  Icon: SdStorageRounded
}
