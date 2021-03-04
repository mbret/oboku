import { DataSourceType, LinkDocType } from "@oboku/shared";

export type ObokuDataSourcePlugin = {
  uniqueResourceIdentifier: string
  type: DataSourceType
  synchronizable: boolean,
  name: string
  Icon: React.FunctionComponent<{}>
  UploadComponent: React.FunctionComponent<{
    onClose: () => void
  }>,
  AddDataSource: React.FunctionComponent<{
    onClose: () => void
  }>,
  useGetCredentials: UseGetCredentials,
  useDownloadBook: UseDownloadHook,
}

export type UseDownloadHook = () => (link: LinkDocType, options?: {
  onDownloadProgress: (event: ProgressEvent, totalSize: number) => void
}) => Promise<{
  data: Blob | File,
  name: string
} | {
  isError: true,
  error?: Error,
  reason: 'unknown' | 'cancelled' | 'popupBlocked'
}>

export type UseGetCredentials = () => () => Promise<{
  isError: true,
  error?: Error,
  reason: 'unknown' | 'cancelled' | 'popupBlocked'
} | {
  data: { [key: string]: string }
}>