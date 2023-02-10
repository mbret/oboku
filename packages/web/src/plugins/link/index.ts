import { HttpRounded } from "@mui/icons-material"
import { ObokuPlugin } from "@oboku/plugin-front"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"

const plugin: ObokuPlugin = {
  type: `URI`,
  name: "Link",
  synchronizable: false,
  uniqueResourceIdentifier: `oboku-link`,
  Icon: HttpRounded,
  AddDataSource: () => null,
  UploadComponent: UploadComponent,
  useDownloadBook,
  useGetCredentials: () => async () => ({ data: {} }),
  useRemoveBook: undefined
}

export default plugin
