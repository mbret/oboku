import { ObokuPlugin } from "@oboku/plugin-front"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "../shared/constants"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"

export const plugin: ObokuPlugin = {
  type: TYPE,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  name: UNIQUE_RESOURCE_IDENTIFIER,
  sensitive: true,
  synchronizable: false,
  UploadComponent,
  useDownloadBook
}
