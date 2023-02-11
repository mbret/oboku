import { ImgIcon, ObokuPlugin } from "@oboku/plugin-front"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "@oboku/plugin-imhentai-shared"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"
import logo from "./logo.png"

export const plugin: ObokuPlugin = {
  type: TYPE,
  uniqueResourceIdentifier: UNIQUE_RESOURCE_IDENTIFIER,
  name: UNIQUE_RESOURCE_IDENTIFIER,
  sensitive: true,
  canSynchronize: false,
  UploadComponent,
  useDownloadBook,
  Icon: () => <ImgIcon src={logo} />
}
