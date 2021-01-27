import * as googleConstants from "./google/constants"
import * as dropboxConstants from "./dropbox/constants"
import { UploadBook as UploadBookFromDropbox } from "./dropbox/UploadBook"
import { ReactComponent as GoogleDriveAsset } from '../assets/google-drive.svg'
import { ReactComponent as DropboxIcon } from '../assets/dropbox.svg'
import { UploadBook } from "./google/UploadBook"
import { DataSourceType } from "oboku-shared"
import { useGetCredentials as useGetGoogleCredentials } from "./google/helpers"
import { useGetCredentials as useGetDropboxCredentials } from "./dropbox/helpers"
import * as googlePlugin from "./google"
import * as dropboxPlugin from "./dropbox"
import { UseDownloadHook, UseGetCredentials } from "./types"

export const plugins: {
  uniqueResourceIdentifier: string
  type: DataSourceType
  name: string
  Icon: React.FunctionComponent<{}>
  UploadComponent: React.FunctionComponent<{
    onClose: () => void
  }>,
  AddDataSource: React.FunctionComponent<{
    onClose: () => void
  }>,
  useGetCredentials: UseGetCredentials,
  useDownloadBook: UseDownloadHook
}[] = []

export const configureDataSources = () => {
  plugins.push({
    uniqueResourceIdentifier: dropboxConstants.UNIQUE_RESOURCE_IDENTIFIER,
    type: DataSourceType.DROPBOX,
    name: 'Dropbox',
    Icon: DropboxIcon,
    UploadComponent: UploadBookFromDropbox,
    AddDataSource: dropboxPlugin.AddDataSource,
    useGetCredentials: useGetDropboxCredentials,
    useDownloadBook: dropboxPlugin.useDownloadBook
  })

  plugins.push({
    uniqueResourceIdentifier: googleConstants.UNIQUE_RESOURCE_IDENTIFIER,
    type: DataSourceType.DRIVE,
    name: 'Google Drive',
    Icon: GoogleDriveAsset,
    UploadComponent: UploadBook,
    AddDataSource: googlePlugin.GoogleDriveDataSource,
    useGetCredentials: useGetGoogleCredentials,
    useDownloadBook: googlePlugin.useDownloadBook
  })
}