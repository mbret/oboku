import type {
  BookMetadata,
  DataSourceDocType,
  DataSourceDocTypeFor,
  LinkData,
  LinkDataForProvider,
  LinkDocType,
  LinkDocTypeForProvider,
  ProviderApiCredentials,
} from "@oboku/shared"
import type {
  ComponentType,
  DOMAttributes,
  FC,
  FunctionComponent,
  ReactElement,
  ReactNode,
} from "react"
import type { SvgIconProps } from "@mui/material"
import type { DeepReadonly } from "rxdb"
import type { UseMutationResult } from "@tanstack/react-query"

/** Link fields that upload payloads can provide (dialog fills book, normalizes data, createdAt, modifiedAt) */
type PostLink<T extends DataSourceDocType["type"] = DataSourceDocType["type"]> =
  Pick<LinkDocTypeForProvider<T>, "type" | "data">

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

export type DownloadBookComponentProps<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  link: LinkDocTypeForProvider<T>
  onDownloadProgress: (progress: number) => void
  onError: (error: unknown) => void
  onResolve: (result: DownloadBookResult) => void
  signal: AbortSignal
}

export type UseRefreshMetadataVariables<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  linkId?: string
  linkType: T
  linkData?: LinkDataForProvider<T> | null
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
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (data: {
  enabled: boolean
  dataSource?: DeepReadonly<DataSourceDocTypeFor<T>> | undefined
}) => {
  name?: string
}

export type UseLinkInfo = (data: {
  linkData?: LinkData | null
  enabled: boolean
}) => {
  data:
    | {
        label?: string
      }
    | undefined
}

export type DataSourceFormData<PluginFields extends Record<string, unknown>> = {
  name: string
  tags: string[]
} & PluginFields

export type DataSourceFormInternalProps<
  T extends DataSourceDocType = DataSourceDocType,
> = {
  dataSource?: DeepReadonly<T>
  onSubmit: (payload: DataSourceSubmitPayload) => void
  submitLabel: string
}

export type DataSourceSubmitPayload = {
  name: string
  tags: string[]
  data_v2: Record<string, unknown>
}

export type DataSourceCreateFormProps = {
  onSubmit: (payload: DataSourceSubmitPayload) => void
}

export type DataSourceEditFormProps = {
  dataSource: DeepReadonly<DataSourceDocType>
  onSubmit: (payload: DataSourceSubmitPayload) => void
}

export type ObokuPlugin<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  name: string
  canSynchronize?: boolean
  canRemoveBook: boolean
  /**
   * Unique ID for the plugin
   */
  type: T
  description?: string
  Icon?: ComponentType<SvgIconProps>
  UploadBookComponent?: FunctionComponent<
    {
      onClose: (booksToAdd?: ReadonlyArray<UploadBookToAddPayload<T>>) => void
      requestPopup: () => Promise<boolean>
      TagsSelector: FC<{
        onChange: (tags: string[]) => void
      }>
      title: string
    } & Pick<DOMAttributes<any>, "onDragLeave">
  >
  DataSourceCreateForm?: FunctionComponent<DataSourceCreateFormProps>
  DataSourceEditForm?: FunctionComponent<DataSourceEditFormProps>
  SelectItemComponent?: FunctionComponent<{
    open: boolean
    requestPopup: () => Promise<boolean>
    onClose: (
      error?: SelectionError | undefined,
      item?: { data: LinkData } | undefined,
    ) => void
  }>
  DownloadBookComponent: FunctionComponent<DownloadBookComponentProps<T>>
  Provider?: FunctionComponent<{ children: ReactNode }>
  InfoScreen?: () => ReactElement
  useRefreshMetadata: UseRefreshMetadataHook<T>
  useSynchronize: UseSynchronizeHook<T>
  useRemoveBook: UseRemoveBook
  useLinkInfo: UseLinkInfo
  useSyncSourceInfo: UseSyncSourceInfo<T>
  useSignOut: () => () => void
}
