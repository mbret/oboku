import type {
  BookMetadata,
  DataSourceDocType,
  LinkDataForProvider,
  LinkDocType,
  LinkDocTypeForProvider,
  ProviderApiCredentials,
} from "@oboku/shared"
import type {
  ComponentProps,
  ComponentType,
  DOMAttributes,
  FC,
  FunctionComponent,
  ReactElement,
  ReactNode,
} from "react"
import type { Button, SvgIconProps } from "@mui/material"
import type { DeepReadonly, DeepReadonlyArray } from "rxdb"
import type { UseMutationResult } from "@tanstack/react-query"
import type { Control, UseFormWatch } from "react-hook-form"

/** Link fields that upload payloads can provide (dialog fills book, normalizes data, createdAt, modifiedAt) */
type PostLink<T extends DataSourceDocType["type"] = DataSourceDocType["type"]> =
  Pick<LinkDocTypeForProvider<T>, "resourceId" | "type" | "data">

/** Minimal book fields that upload payloads can provide (dialog merges with tags, etc.) */
type PostBook = {
  metadata?: Array<Pick<BookMetadata, "type" | "title">>
  title?: string
}

export type UploadBookToAddPayload<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  book: PostBook
  link: PostLink<T>
  /** When set (e.g. local file upload), dialog will trigger download after add */
  file?: File
}

type Item = {
  resourceId: string
}

type SelectionError = {
  code: `unknown`
  originalError?: any
}

export type StreamValue = {
  baseUri: string
  response: Response
  progress: number
}

export type DownloadBookResult = {
  data: File | Blob | ReadableStream<StreamValue>
  fileName: string
}

export type DownloadBookComponentProps = {
  link: LinkDocType
  onDownloadProgress: (progress: number) => void
  onError: (error: unknown) => void
  onResolve: (result: DownloadBookResult) => void
  signal: AbortSignal
}

/** Mutation variables for useRefreshMetadata; linkData may be {} when link.data is null. */
export type UseRefreshMetadataVariables<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  linkId?: string
  linkType: T
  linkData: LinkDataForProvider<T> | Record<string, never>
  linkResourceId?: string
}

/** Params for usePluginRefreshMetadata(); discriminated union on linkType. */
export type UseRefreshMetadataRequest = UseRefreshMetadataVariables<
  DataSourceDocType["type"]
>

export type UseRefreshMetadataHook<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (options: { requestPopup: () => Promise<boolean> }) => UseMutationResult<
  {
    providerCredentials: ProviderApiCredentials<T>
  },
  Error | null,
  UseRefreshMetadataVariables<T>
>

export type UseSynchronizeHook<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (options: { requestPopup: () => Promise<boolean> }) => UseMutationResult<
  {
    providerCredentials: ProviderApiCredentials<T>
  },
  Error | null,
  Extract<DataSourceDocType, { type: T }>
>

type UseRemoveBook = (options: { requestPopup: () => Promise<boolean> }) => (
  link: LinkDocType,
) => Promise<
  | {
      providerCredentials: ProviderApiCredentials<LinkDocType["type"]>
    }
  | {
      isError: true
      error?: Error
      reason: `unknown`
    }
>

export type UseSyncSourceInfo<
  // biome-ignore lint/correctness/noUnusedVariables: Kept for easier maintenance
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (data: {
  enabled: boolean
  dataSource?: DeepReadonly<DataSourceDocType> | undefined
}) => {
  name?: string
}

export type UseLinkInfo = (data: { resourceId?: string; enabled: boolean }) => {
  data:
    | {
        label?: string
      }
    | undefined
}

export type DataSourceFormData = {
  name: string
  tags: DeepReadonlyArray<string>
  data: Record<string, unknown>
}

export type ObokuPlugin<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  uniqueResourceIdentifier: string
  name: string
  canSynchronize?: boolean
  canRemoveBook: boolean
  /**
   * Unique ID for the plugin
   */
  type: T
  description?: string
  sensitive?: boolean
  Icon?: ComponentType<SvgIconProps>
  UploadBookComponent?: FunctionComponent<
    {
      onClose: (booksToAdd?: ReadonlyArray<UploadBookToAddPayload<T>>) => void
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
  DataSourceForm?: FunctionComponent<{
    control: Control<DataSourceFormData, any, DataSourceFormData>
    watch: UseFormWatch<DataSourceFormData>
  }>
  DataSourceDetails?: FunctionComponent<{
    control: Control<DataSourceFormData, any, DataSourceFormData>
    watch: UseFormWatch<DataSourceFormData>
  }>
  SelectItemComponent?: FunctionComponent<{
    open: boolean
    requestPopup: () => Promise<boolean>
    onClose: (
      error?: SelectionError | undefined,
      item?: Item | undefined,
    ) => void
  }>
  DownloadBookComponent: FunctionComponent<DownloadBookComponentProps>
  Provider?: FunctionComponent<{ children: ReactNode }>
  InfoScreen?: () => ReactElement
  useRefreshMetadata: UseRefreshMetadataHook<T>
  useSynchronize: UseSynchronizeHook<T>
  useRemoveBook: UseRemoveBook
  useLinkInfo: UseLinkInfo
  useSyncSourceInfo: UseSyncSourceInfo<T>
  useSignOut: () => () => void
}

export const extractIdFromResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string,
) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)
