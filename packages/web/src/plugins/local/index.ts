import { SdStorageRounded } from "@mui/icons-material"
import { ObokuPlugin } from "../types"
import { UploadBook } from "./UploadBook"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"
import { ObokuPluginError } from "../../errors/errors.shared"

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: "file",
  type: PLUGIN_FILE_TYPE,
  name: "file",
  UploadBookComponent: UploadBook,
  Icon: SdStorageRounded,
  description: "Manage books from your device (local)",
  useDownloadBook: () => () => {
    throw new ObokuPluginError({
      code: "unknown",
      severity: "user",
      message:
        "You cannot download this book since it has been added on a different device. Please use your other device to read or synchronize your book using a cloud provider."
    })
  }
}
