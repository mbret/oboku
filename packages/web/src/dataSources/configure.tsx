import * as googleConstants from "./google/constants"
import * as dropboxConstants from "./dropbox/constants"
import { UploadBook as UploadBookFromDropbox } from "./dropbox/UploadBook"
import { ReactComponent as GoogleDriveAsset } from '../assets/google-drive.svg'
import { ReactComponent as DropboxIconAsset } from '../assets/dropbox.svg'
import { UploadBook } from "./google/UploadBook"
import { DataSourceType } from "@oboku/shared"
import { useGetCredentials as useGetGoogleCredentials } from "./google/helpers"
import { useGetCredentials as useGetDropboxCredentials } from "./dropbox/helpers"
import * as googlePlugin from "./google"
import * as dropboxPlugin from "./dropbox"
import linkPlugin from "./link"
import { ObokuDataSourcePlugin } from "./types"
import { SvgIcon } from "@material-ui/core"

export const plugins: ObokuDataSourcePlugin[] = []

const DropboxIcon = () => (
  <SvgIcon>
    <DropboxIconAsset />
  </SvgIcon>
)

const GoogleDriveIcon = () => (
  <SvgIcon>
    <GoogleDriveAsset />
  </SvgIcon>
)

export const configureDataSources = () => {
  plugins.push({
    uniqueResourceIdentifier: dropboxConstants.UNIQUE_RESOURCE_IDENTIFIER,
    type: DataSourceType.DROPBOX,
    name: 'Dropbox',
    Icon: DropboxIcon,
    UploadComponent: UploadBookFromDropbox,
    AddDataSource: dropboxPlugin.AddDataSource,
    useGetCredentials: useGetDropboxCredentials,
    useDownloadBook: dropboxPlugin.useDownloadBook,
    useRemoveBook: dropboxPlugin.useRemoveBook,
    synchronizable: true,
  })

  plugins.push({
    uniqueResourceIdentifier: googleConstants.UNIQUE_RESOURCE_IDENTIFIER,
    type: DataSourceType.DRIVE,
    name: 'Google Drive',
    Icon: GoogleDriveIcon,
    UploadComponent: UploadBook,
    AddDataSource: googlePlugin.GoogleDriveDataSource,
    useGetCredentials: useGetGoogleCredentials,
    useDownloadBook: googlePlugin.useDownloadBook,
    useRemoveBook: googlePlugin.useRemoveBook,
    synchronizable: true,
  })

  plugins.push(linkPlugin)
}