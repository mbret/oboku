import {
  DataSourceDocType,
  LinkDocType,
  dataSourceHelpers
} from "@oboku/shared"
import { ComponentProps, FC, FunctionComponent, ReactNode } from "react"
import { Button } from "@mui/material"
import { PostBook, PostLink } from "./types"

export { ImgIcon } from "./ImgIcon"

export { dataSourceHelpers }

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

export type UseDownloadHook = (options: {
  apiUri: string
  requestPopup: () => Promise<boolean>
}) => (
  link: LinkDocType,
  options: {
    onDownloadProgress: (progress: number) => void
  }
) => Promise<
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

export type UseRefreshMetadataHook = (options: {
  requestPopup: () => Promise<boolean>
}) => (link: LinkDocType) => Promise<{
  data?: object
}>

export type UseSynchronizeHook = (options: {
  requestPopup: () => Promise<boolean>
}) => () => Promise<{
  data?: object
}>

export type UseRemoveBook = (options: {
  requestPopup: () => Promise<boolean>
}) => (link: LinkDocType) => Promise<
  | {
      data: Record<string, unknown>
    }
  | {
      isError: true
      error?: Error
      reason: `unknown`
    }
>

export type UseSyncSourceInfo = (dataSource: DataSourceDocType) => {
  name?: string
}

export type ObokuPlugin = {
  uniqueResourceIdentifier: string
  name: string
  canSynchronize?: boolean
  type: string
  sensitive?: boolean
  Icon?: FunctionComponent<Record<string, never>>
  UploadComponent?: FunctionComponent<{
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
  }>
  AddDataSource?: FunctionComponent<{
    onClose: () => void
    requestPopup: () => Promise<boolean>
  }>
  SelectItemComponent?: FunctionComponent<{
    open: boolean
    requestPopup: () => Promise<boolean>
    onClose: (
      error?: SelectionError | undefined,
      item?: Item | undefined
    ) => void
  }>
  Provider?: FunctionComponent<{ children: ReactNode }>
  useRefreshMetadata?: UseRefreshMetadataHook
  useSynchronize?: UseSynchronizeHook
  useDownloadBook?: UseDownloadHook
  useRemoveBook?: UseRemoveBook | undefined
  useSyncSourceInfo?: UseSyncSourceInfo
}

export const extractIdFromResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string
) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)

export const extractSyncSourceData = <Data extends Record<any, any>>({
  data
}: DataSourceDocType) => {
  try {
    return JSON.parse(data) as Data
  } catch (e) {
    return undefined
  }
}

export * from "./errors"
