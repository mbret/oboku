import type {
  DataSourceDocType,
  LinkMetadata,
  DataSourceDocTypeFor,
  LinkData,
  LinkDataForProvider,
  LinkDocType,
  LinkDocTypeForProvider,
  MetadataFileDownloadOverride,
  ProviderApiCredentials,
  SettingsConnectorDocType,
  SettingsConnectorType,
} from "@oboku/shared"
import type { ComponentType, DOMAttributes, ReactNode } from "react"
import type { SvgIconProps } from "@mui/material"
import type { DeepReadonly } from "rxdb"
import type {
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query"
import type { Config } from "../../config/useConfig"

/** Link fields that upload payloads can provide (dialog fills book, normalizes data, createdAt, modifiedAt) */
type PostLink<T extends DataSourceDocType["type"] = DataSourceDocType["type"]> =
  Pick<LinkDocTypeForProvider<T>, "type" | "data">

/** Minimal book fields that upload payloads can provide (dialog merges with tags, etc.) */
type PostBook = {
  metadata?: Array<Pick<LinkMetadata, "type" | "title">>
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

export type UploadBookComponentProps<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
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
> = (
  options: {
    requestPopup: () => Promise<boolean>
  } & Pick<UseMutationOptions, "meta">,
) => UseMutationResult<
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

export type RemoveResourceResult<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> =
  | {
      providerCredentials: ProviderApiCredentials<T>
    }
  | {
      isError: true
      error?: Error
      reason: `unknown`
    }

type RemoveResourceCapability<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> =
  | {
      canRemoveResource: true
      removeResource: (
        links: readonly Extract<LinkDocType, { type: T }>[],
      ) => Promise<RemoveResourceResult<T>>
    }
  | {
      canRemoveResource: false
      removeResource?: undefined
    }

export type UpsertFileComponentProps<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  link: LinkDocTypeForProvider<T>
  file: Blob | File
  fileName: string
  contentType?: string
  onProgress: (progress: number) => void
  onError: (error: unknown) => void
  onSuccess: () => void
  signal: AbortSignal
}

export type UpsertFileComponent<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = ComponentType<UpsertFileComponentProps<T>>

type UpsertFileCapability<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> =
  | {
      canUpsertFile: true
      /** Whether upserting a file deletes the versions the provider kept for it */
      upsertPrunesVersionHistory?: boolean
      UpsertFileComponent: UpsertFileComponent<T>
    }
  | {
      canUpsertFile?: false
      upsertPrunesVersionHistory?: undefined
      UpsertFileComponent?: undefined
    }

/**
 * `connector` is the connector the data source names, or `undefined` when it
 * names none or the settings do not hold it.
 */
export type GetDataSourceLabel<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (
  dataSource: DeepReadonly<DataSourceDocTypeFor<T>>,
  connector: Extract<SettingsConnectorDocType, { type: T }> | undefined,
) => string | undefined

export type GetLinkLabel<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = (linkData: LinkDataForProvider<T>) => string | undefined

export type DataSourceFormData<PluginFields extends Record<string, unknown>> = {
  name: string
  tags: string[]
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
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
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
}

type KeyOfEachMember<T> = T extends unknown ? keyof T : never

type FeatureFlag = {
  [K in keyof Config]: Config[K] extends boolean ? K : never
}[keyof Config]

export type ConnectorFormProps = {
  onSubmitSuccess: () => void
  children?: ReactNode
  connectorId?: string
}

export type PluginIntegration = {
  name: string
  description: string
  route: string
}

export type ConnectorDetails<
  T extends SettingsConnectorType = SettingsConnectorType,
> = {
  type: T
  label: string
  integrationRoute: string
}

type ConnectorCapability<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = T extends SettingsConnectorType
  ? {
      connector: ConnectorDetails<T> & {
        ConnectorForm: ComponentType<ConnectorFormProps>
      }
      integration: PluginIntegration
    }
  : {
      connector?: undefined
      integration?: PluginIntegration
    }

type ObokuPluginBase<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = {
  name: string
  canSynchronize?: boolean
  /**
   * Unique ID for the plugin
   */
  type: T
  Icon: ComponentType<SvgIconProps>
  /** Collections whose link data match on these fields show as duplicates on the Problems screen. */
  collectionIdentityFields: ReadonlyArray<
    KeyOfEachMember<LinkDataForProvider<T>>
  >
  /** The config flag that turns the plugin on. A plugin without it is always enabled. */
  featureFlag?: FeatureFlag
  UploadBookComponent?: ComponentType<UploadBookComponentProps<T>>
  DataSourceForm?: ComponentType<
    DataSourceFormInternalProps<DataSourceDocTypeFor<T>>
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
  useRefreshMetadata: UseRefreshMetadataHook<T>
  useSynchronize: UseSynchronizeHook<T>
  getLinkLabel: GetLinkLabel<T>
  getDataSourceLabel: GetDataSourceLabel<T>
  /** Forgets the provider session, so the next account does not inherit it. */
  signOut: () => void
}

export type ObokuPlugin<
  T extends DataSourceDocType["type"] = DataSourceDocType["type"],
> = ObokuPluginBase<T> &
  UpsertFileCapability<T> &
  ConnectorCapability<T> &
  RemoveResourceCapability<T>
