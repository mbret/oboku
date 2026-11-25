import type {
  LibrarySyncDocType,
  LinkMetadata,
  LibrarySyncDocTypeFor,
  LinkData,
  LinkDataForSource,
  LinkDocTypeForSource,
  MetadataFileDownloadOverride,
  SourceApiCredentials,
  SourceType,
} from "@oboku/shared"
import type { ComponentType, DOMAttributes, ReactNode } from "react"
import type { SvgIconProps } from "@mui/material"
import type { DeepReadonly } from "rxdb"
import type {
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query"

/** Link fields that upload payloads can provide (dialog fills book, normalizes data, createdAt, modifiedAt) */
type PostLink<T extends SourceType = SourceType> = Pick<
  LinkDocTypeForSource<T>,
  "type" | "data"
>

/** Minimal book fields that upload payloads can provide (dialog merges with tags, etc.) */
type PostBook = {
  metadata?: Array<Pick<LinkMetadata, "type" | "title">>
  title?: string
}

export type UploadBookToAddPayload<T extends SourceType = SourceType> = {
  book: PostBook
  link: PostLink<T>
  /** When set (e.g. local file upload), dialog will trigger download after add */
  file?: File
}

type SelectionError = {
  code: `unknown`
  originalError?: any
}

export type UploadBookComponentProps<T extends SourceType = SourceType> = {
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

export type DownloadBookComponentProps<T extends SourceType = SourceType> = {
  link: LinkDocTypeForSource<T>
  onDownloadProgress: (progress: number) => void
  onError: (error: unknown) => void
  onResolve: (result: DownloadBookResult) => void
  signal: AbortSignal
}

export type UseRefreshMetadataVariables<T extends SourceType = SourceType> = {
  linkId?: string
  linkType: T
  linkData?: LinkDataForSource<T> | null
}

/** Params for usePluginRefreshMetadata(); discriminated union on linkType. */
export type UseRefreshMetadataRequest = UseRefreshMetadataVariables<SourceType>

export type UseRefreshMetadataHook<T extends SourceType = SourceType> = (
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

export type UseSynchronizeHook<T extends SourceType = SourceType> = (options: {
  requestPopup: () => Promise<boolean>
}) => UseMutationResult<
  {
    providerCredentials: SourceApiCredentials<T>
  },
  Error | null,
  Extract<LibrarySyncDocType, { type: T }>
>

export type RemoveResourceResult<T extends SourceType = SourceType> =
  | {
      providerCredentials: SourceApiCredentials<T>
    }
  | {
      isError: true
      error?: Error
      reason: `unknown`
    }

type UseRemoveResource<T extends SourceType = SourceType> = () => (
  links: readonly LinkDocTypeForSource<T>[],
) => Promise<RemoveResourceResult<T>>

export type UpsertFileComponentProps<T extends SourceType = SourceType> = {
  link: LinkDocTypeForSource<T>
  file: Blob | File
  fileName: string
  contentType?: string
  onProgress: (progress: number) => void
  onError: (error: unknown) => void
  onSuccess: () => void
  signal: AbortSignal
}

export type UpsertFileComponent<T extends SourceType = SourceType> =
  ComponentType<UpsertFileComponentProps<T>>

type UpsertFileCapability<T extends SourceType = SourceType> =
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

export type UseLibrarySyncInfo<T extends SourceType = SourceType> = (data: {
  enabled: boolean
  librarySync?: DeepReadonly<LibrarySyncDocTypeFor<T>> | undefined
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

export type LibrarySyncFormData<PluginFields extends Record<string, unknown>> =
  {
    name: string
    tags: string[]
    metadataFileDownloadEnabled: MetadataFileDownloadOverride
  } & PluginFields

export type LibrarySyncFormInternalProps<
  T extends LibrarySyncDocType = LibrarySyncDocType,
> = {
  librarySync?: DeepReadonly<T>
  onSubmit: (payload: LibrarySyncSubmitPayload) => void
  submitLabel: string
}

export type LibrarySyncSubmitPayload = {
  name: string
  tags: string[]
  data_v2: Record<string, unknown>
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
}

type ObokuPluginBase<T extends SourceType = SourceType> = {
  name: string
  canSynchronize?: boolean
  canRemoveResource: boolean
  /**
   * Unique ID for the plugin
   */
  type: T
  Icon: ComponentType<SvgIconProps>
  UploadBookComponent?: ComponentType<UploadBookComponentProps<T>>
  LibrarySyncForm?: ComponentType<
    LibrarySyncFormInternalProps<LibrarySyncDocTypeFor<T>>
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
  useLibrarySyncInfo: UseLibrarySyncInfo<T>
  useSignOut: () => () => void
}

export type SourcePlugin<T extends SourceType = SourceType> =
  ObokuPluginBase<T> & UpsertFileCapability<T>
