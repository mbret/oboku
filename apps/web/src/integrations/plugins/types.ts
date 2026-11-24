import type {
  LibrarySyncDocType,
  LinkMetadata,
  LibrarySyncDocTypeFor,
  LinkData,
  LinkDataForSource,
  LinkDocTypeForSource,
  MetadataFileDownloadOverride,
  SourceApiCredentials,
} from "@oboku/shared"
import type { ComponentType, DOMAttributes, ReactNode } from "react"
import type { SvgIconProps } from "@mui/material"
import type { DeepReadonly } from "rxdb"
import type {
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query"

/** Link fields that upload payloads can provide (dialog fills book, normalizes data, createdAt, modifiedAt) */
type PostLink<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = Pick<LinkDocTypeForSource<T>, "type" | "data">

/** Minimal book fields that upload payloads can provide (dialog merges with tags, etc.) */
type PostBook = {
  metadata?: Array<Pick<LinkMetadata, "type" | "title">>
  title?: string
}

export type UploadBookToAddPayload<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
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

export type UploadBookComponentProps<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = {
  onClose: (booksToAdd?: ReadonlyArray<UploadBookToAddPayload<T>>) => void
  requestPopup: () => Promise<boolean>
  TagsSelector: ComponentType<{
    onChange: (tags: string[]) => void
  }>
  title: string
} & Pick<DOMAttributes<any>, "onDragLeave">

export type DownloadBookResult = {
  data: File | Blob
  fileName: string
}

export type DownloadBookComponentProps<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = {
  link: LinkDocTypeForSource<T>
  onDownloadProgress: (progress: number) => void
  onError: (error: unknown) => void
  onResolve: (result: DownloadBookResult) => void
  signal: AbortSignal
}

export type UseRefreshMetadataVariables<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = {
  linkId?: string
  linkType: T
  linkData?: LinkDataForSource<T> | null
}

/** Params for usePluginRefreshMetadata(); discriminated union on linkType. */
export type UseRefreshMetadataRequest = UseRefreshMetadataVariables<
  LibrarySyncDocType["type"]
>

export type UseRefreshMetadataHook<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = (
  options: {
    requestPopup: () => Promise<boolean>
  } & Pick<UseMutationOptions, "meta">,
) => UseMutationResult<
  {
    providerCredentials: SourceApiCredentials<T>
  },
  Error | null,
  UseRefreshMetadataVariables<T>
>

export type UseSynchronizeHook<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = (options: { requestPopup: () => Promise<boolean> }) => UseMutationResult<
  {
    providerCredentials: SourceApiCredentials<T>
  },
  Error | null,
  Extract<LibrarySyncDocType, { type: T }>
>

export type RemoveResourceResult<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> =
  | {
      providerCredentials: SourceApiCredentials<T>
    }
  | {
      isError: true
      error?: Error
      reason: `unknown`
    }

type UseRemoveResource<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = () => (
  links: readonly LinkDocTypeForSource<T>[],
) => Promise<RemoveResourceResult<T>>

export type UpsertFileComponentProps<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = {
  link: LinkDocTypeForSource<T>
  file: Blob | File
  fileName: string
  contentType?: string
  onProgress: (progress: number) => void
  onError: (error: unknown) => void
  onSuccess: () => void
  signal: AbortSignal
}

export type UpsertFileComponent<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = ComponentType<UpsertFileComponentProps<T>>

type UpsertFileCapability<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> =
  | {
      canUpsertFile: true
      /** Whether upserting a file deletes the versions the source kept for it */
      upsertPrunesVersionHistory?: boolean
      UpsertFileComponent: UpsertFileComponent<T>
    }
  | {
      canUpsertFile?: false
      upsertPrunesVersionHistory?: undefined
      UpsertFileComponent?: undefined
    }

export type UseSyncSourceInfo<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = (data: {
  enabled: boolean
  dataSource?: DeepReadonly<LibrarySyncDocTypeFor<T>> | undefined
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
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
} & PluginFields

export type DataSourceFormInternalProps<
  T extends LibrarySyncDocType = LibrarySyncDocType,
> = {
  dataSource?: DeepReadonly<T>
  onSubmit: (payload: DataSourceSubmitPayload) => void
  submitLabel: string
}

export type DataSourceSubmitPayload = {
  name: string
  tags: string[]
  data_v2: Record<string, unknown>
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
}

type ObokuPluginBase<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = {
  name: string
  canSynchronize?: boolean
  canRemoveResource: boolean
  /**
   * Unique ID for the plugin
   */
  type: T
  Icon: ComponentType<SvgIconProps>
  UploadBookComponent?: ComponentType<UploadBookComponentProps<T>>
  DataSourceForm?: ComponentType<
    DataSourceFormInternalProps<LibrarySyncDocTypeFor<T>>
  >
  SelectItemComponent?: ComponentType<{
    open: boolean
    requestPopup: () => Promise<boolean>
    onClose: (
      error?: SelectionError | undefined,
      item?: { data: LinkData } | undefined,
    ) => void
  }>
  DownloadBookComponent: ComponentType<DownloadBookComponentProps<T>>
  Provider?: ComponentType<{ children: ReactNode }>
  // The members below are hooks on purpose, even when no plugin calls a React
  // hook in them and they return a plain value: a hook can use any React
  // context, so the plugin API stays open to a future plugin. Never turn one
  // into a plain function. Hooks cannot run in a loop, so generic code calls
  // each plugin's hook by name, or runs it in a component made for its type.
  useRefreshMetadata: UseRefreshMetadataHook<T>
  useSynchronize: UseSynchronizeHook<T>
  useRemoveResource: UseRemoveResource<T>
  useLinkInfo: UseLinkInfo
  useSyncSourceInfo: UseSyncSourceInfo<T>
  useSignOut: () => () => void
}

export type SourcePlugin<
  T extends LibrarySyncDocType["type"] = LibrarySyncDocType["type"],
> = ObokuPluginBase<T> & UpsertFileCapability<T>
