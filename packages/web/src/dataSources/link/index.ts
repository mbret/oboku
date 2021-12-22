import { HttpRounded } from "@material-ui/icons"
import { DataSourceType, dataSourcePlugins } from "@oboku/shared"
import { ObokuDataSourcePlugin } from "../types"
import { UploadComponent } from "./UploadComponent"
import { useDownloadBook } from "./useDownloadBook"

const plugin: ObokuDataSourcePlugin = {
  type: DataSourceType.URI,
  name: 'Link',
  synchronizable: false,
  uniqueResourceIdentifier: dataSourcePlugins[DataSourceType.URI].uniqueResourceIdentifier,
  Icon: HttpRounded,
  AddDataSource: () => null,
  UploadComponent: UploadComponent,
  useDownloadBook,
  useGetCredentials: () => async () => ({ data: {} }),
  useRemoveBook: undefined,
}

export default plugin