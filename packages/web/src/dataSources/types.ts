import { DataSourceDocType, DataSourcePlugin, LinkDocType } from "@oboku/shared";

type Item = {
  resourceId: string
}

type SelectionError = {
  code: `unknown`,
  originalError?: any
}

type StreamValue = {
  baseUri: string,
  response: Response,
  progress: number
}

export type ObokuDataSourcePlugin = DataSourcePlugin & {
  Icon?: React.FunctionComponent<{}>
  UploadComponent?: React.FunctionComponent<{
    onClose: (bookToAdd?: { resourceId: string, tags?: string[] }) => void,
    title: string
  }>,
  AddDataSource?: React.FunctionComponent<{
    onClose: () => void
  }>,
  SelectItemComponent?: React.FunctionComponent<{
    open: boolean,
    onClose: (error?: SelectionError | undefined, item?: Item | undefined) => void,
  }>
  useGetCredentials?: UseGetCredentials,
  useDownloadBook?: UseDownloadHook,
  useRemoveBook?: UseRemoveBook | undefined,
  useSyncSourceInfo?: UseSyncSourceInfo
}

export type UseDownloadHook = () => (link: LinkDocType, options: {
  onDownloadProgress: (progress: number) => void,
}) => Promise<{
  data: Blob | File | ReadableStream<StreamValue>,
  name?: string
} | {
  isError: true,
  error?: any,
  reason: 'unknown' | 'cancelled' | 'popupBlocked' | `notFound`
}>

export type UseRemoveBook = () => (link: LinkDocType) => Promise<{
  data: {}
} | {
  isError: true,
  error?: Error,
  reason: 'unknown'
}>

export type UseGetCredentials = () => () => Promise<{
  isError: true,
  error?: Error,
  reason: 'unknown' | 'cancelled' | 'popupBlocked'
} | {
  data: { [key: string]: string }
}>

export type UseSyncSourceInfo = (dataSource: DataSourceDocType) => {
  name?: string
}