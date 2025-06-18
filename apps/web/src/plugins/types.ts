import type { DataSourceDocType, LinkDocType } from "@oboku/shared"
import type {
  ComponentProps,
  DOMAttributes,
  FC,
  FunctionComponent,
  ReactElement,
  ReactNode,
} from "react"
import type { Button } from "@mui/material"
import type { Observable } from "rxjs"
import type { DeepReadonly } from "rxdb"
import type { UseMutationResult } from "@tanstack/react-query"

type PostLink = Pick<LinkDocType, "resourceId" | "type">
// biome-ignore lint/complexity/noBannedTypes: TODO
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
  requestPopup: () => Promise<boolean>
}) => (params: {
  link: LinkDocType
  onDownloadProgress: (progress: number) => void
}) => Observable<{
  data: Blob | File | ReadableStream<StreamValue>
  name?: string
}>

type UseRefreshMetadataHook = (options: {
  requestPopup: () => Promise<boolean>
}) => UseMutationResult<
  {
    data: Record<string, unknown>
  },
  Error | null,
  { linkType: DataSourceDocType["type"]; linkData: Record<string, unknown> }
>

export type UseSynchronizeHook<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (options: { requestPopup: () => Promise<boolean> }) => UseMutationResult<
  {
    data: Record<string, unknown>
  },
  Error | null,
  Extract<DataSourceDocType, { type: T }>
>

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

export type UseSyncSourceInfo<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (dataSource: DeepReadonly<Extract<DataSourceDocType, { type: T }>>) => {
  name?: string
}

export type UseLinkInfo = (data: { resourceId?: string; enabled: boolean }) => {
  data:
    | {
        label?: string
      }
    | undefined
}

export type ObokuPlugin<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  uniqueResourceIdentifier: string
  name: string
  canSynchronize?: boolean
  /**
   * Unique ID for the plugin
   */
  type: T
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
  InfoScreen?: () => ReactElement
  useRefreshMetadata?: UseRefreshMetadataHook
  useSynchronize?: UseSynchronizeHook<T>
  useDownloadBook?: UseDownloadHook
  useRemoveBook?: UseRemoveBook | undefined
  useSyncSourceInfo?: UseSyncSourceInfo<T>
}

export const extractIdFromResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string,
) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)
