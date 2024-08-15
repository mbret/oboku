import { SdStorageRounded } from "@mui/icons-material"
import { ObokuPlugin } from "../types"
import { UploadBook } from "./UploadBook"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: "file",
  type: PLUGIN_FILE_TYPE,
  name: "file",
  UploadComponent: UploadBook,
  Icon: SdStorageRounded,
  description: "Manage books from your device (local)"
}
