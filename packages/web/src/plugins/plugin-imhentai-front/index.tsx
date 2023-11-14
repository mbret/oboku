import { ImgIcon, ObokuPlugin } from "@oboku/plugin-front"
import {
  PLUGIN_IMHENTAI_TYPE,
  PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER
} from "@oboku/shared"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"
import logo from "./logo.png"

export const plugin: ObokuPlugin = {
  type: PLUGIN_IMHENTAI_TYPE,
  uniqueResourceIdentifier: PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER,
  name: PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER,
  sensitive: true,
  canSynchronize: false,
  UploadComponent,
  useDownloadBook,
  Icon: () => <ImgIcon src={logo} />
}
