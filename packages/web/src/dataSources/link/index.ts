import { HttpRounded } from "@material-ui/icons"
import { dataSourcePlugins } from "@oboku/shared"
import { ObokuDataSourcePlugin } from "../types"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"

const plugin: ObokuDataSourcePlugin = {
  type: `URI`,
  name: 'Link',
  synchronizable: false,
  uniqueResourceIdentifier: dataSourcePlugins[`URI`]?.uniqueResourceIdentifier || ``,
  Icon: HttpRounded,
  AddDataSource: () => null,
  UploadComponent: UploadComponent,
  useDownloadBook,
  useGetCredentials: () => async () => ({ data: {} }),
  useRemoveBook: undefined,
}

export default plugin