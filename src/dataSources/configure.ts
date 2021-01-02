import * as googleConstants from "./google/constants"
import * as dropboxConstants from "./dropbox/constants"
import { UploadBook as UploadBookFromDropbox } from "./dropbox/UploadBook"
import { ReactComponent as GoogleDriveAsset } from '../assets/google-drive.svg'
import { UploadBook } from "./google/UploadBook"
import { DataSourceType } from "oboku-shared"
import { StorageRounded } from "@material-ui/icons"
import { useGetCredentials as useGetGoogleCredentials } from "./google/helpers"
import { useGetCredentials as useGetDropboxCredentials } from "./dropbox/helpers"

export const plugins: {
  uniqueResourceIdentifier: string
  type: DataSourceType
  name: string
  Icon: React.FunctionComponent<{}>
  UploadComponent: React.FunctionComponent<{
    onClose: () => void
  }>,
  useGetCredentials: () => () => Promise<any>
}[] = []

export const configureDataSources = () => {
  plugins.push({
    uniqueResourceIdentifier: dropboxConstants.UNIQUE_RESOURCE_IDENTIFIER,
    type: DataSourceType.DROPBOX,
    name: 'Dropbox',
    Icon: StorageRounded,
    UploadComponent: UploadBookFromDropbox,
    useGetCredentials: useGetDropboxCredentials
  })

  plugins.push({
    uniqueResourceIdentifier: googleConstants.UNIQUE_RESOURCE_IDENTIFIER,
    type: DataSourceType.DRIVE,
    name: 'Google Drive',
    Icon: GoogleDriveAsset,
    UploadComponent: UploadBook,
    useGetCredentials: useGetGoogleCredentials
  })
}