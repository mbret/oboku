import type { DataSourceDocType, LinkDocType } from "@oboku/shared"
import type {
  ComponentProps,
  DOMAttributes,
  FC,
  FunctionComponent,
  ReactNode,
} from "react"
import type { Button } from "@mui/material"
import type { Observable } from "rxjs"

type PostLink = Pick<LinkDocType, "resourceId" | "type">
type PostBook = {}

type Item = {
  resourceId: string
}

type SelectionError = {
  code: `unknown`
  originalError?: any
}

type StreamValue = {
  baseUri: string
  response: Response
  progress: number
}

type UseDownloadHook = (options: {
  apiUri: string
  requestPopup: () => Promise<boolean>
}) => (params: {
  link: LinkDocType
  onDownloadProgress: (progress: number) => void
}) => Observable<
  | {
      data: Blob | File | ReadableStream<StreamValue>
      name?: string
    }
  | {
      isError: true
      error?: any
      reason: `unknown` | `cancelled` | `popupBlocked` | `notFound`
    }
>

type UseRefreshMetadataHook = (options: {
  requestPopup: () => Promise<boolean>
}) => (data: { linkType: string }) => Promise<{
  data?: object
}>

type UseSynchronizeHook = (options: {
  requestPopup: () => Promise<boolean>
}) => () => Promise<{
  data?: object
}>

type UseRemoveBook = (options: { requestPopup: () => Promise<boolean> }) => (
  link: LinkDocType,
) => Promise<
  | {
      data: Record<string, unknown>
    }
  | {
      isError: true
      error?: Error
      reason: `unknown`
    }
>

type UseSyncSourceInfo = (dataSource: DataSourceDocType) => {
  name?: string
}

export type ObokuPlugin = {
  uniqueResourceIdentifier: string
  name: string
  canSynchronize?: boolean
  /**
   * Unique ID for the plugin
   */
  type: string
  description?: string
  sensitive?: boolean
  Icon?: FunctionComponent<Record<string, never>>
  UploadBookComponent?: FunctionComponent<
    {
      onClose: (bookToAdd?: { book: PostBook; link: PostLink }) => void
      requestPopup: () => Promise<boolean>
      TagsSelector: FC<{
        onChange: (tags: string[]) => void
      }>
      ButtonDialog: FC<
        Omit<ComponentProps<typeof Button>, `type`> & {
          type: `confirm` | `cancel`
        }
      >
      title: string
    } & Pick<DOMAttributes<any>, "onDragLeave">
  >
  AddDataSource?: FunctionComponent<{
    onClose: () => void
    requestPopup: () => Promise<boolean>
  }>
  SelectItemComponent?: FunctionComponent<{
    open: boolean
    requestPopup: () => Promise<boolean>
    onClose: (
      error?: SelectionError | undefined,
      item?: Item | undefined,
    ) => void
  }>
  Provider?: FunctionComponent<{ children: ReactNode }>
  InfoScreen?: () => JSX.Element
  useRefreshMetadata?: UseRefreshMetadataHook
  useSynchronize?: UseSynchronizeHook
  useDownloadBook?: UseDownloadHook
  useRemoveBook?: UseRemoveBook | undefined
  useSyncSourceInfo?: UseSyncSourceInfo
}

export const extractIdFromResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string,
) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)
