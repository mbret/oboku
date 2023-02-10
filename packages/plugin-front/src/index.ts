import {
  DataSourceDocType,
  LinkDocType,
  dataSourceHelpers
} from "@oboku/shared"
import { ComponentProps, FC, FunctionComponent, ReactNode } from "react"
import { Button } from "@mui/material"
import * as yup from "yup"

export { ImgIcon } from "./ImgIcon"

export { yup, dataSourceHelpers }

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

export type UseDownloadHook = (options: { apiUri: string }) => (
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

export type UseRemoveBook = () => (link: LinkDocType) => Promise<
  | {
      data: Record<string, unknown>
    }
  | {
      isError: true
      error?: Error
      reason: `unknown`
    }
>

export type UseGetCredentials = () => () => Promise<
  | {
      isError: true
      error?: Error
      reason: `unknown` | `cancelled` | `popupBlocked`
    }
  | {
      data: object
    }
>

export type UseSyncSourceInfo = (dataSource: DataSourceDocType) => {
  name?: string
}

export type ObokuPlugin = {
  uniqueResourceIdentifier: string
  name: string
  synchronizable?: boolean
  type: string
  sensitive?: boolean
  Icon?: FunctionComponent<Record<string, never>>
  UploadComponent?: FunctionComponent<{
    onClose: (bookToAdd?: { resourceId: string; tags?: string[] }) => void
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
  }>
  SelectItemComponent?: FunctionComponent<{
    open: boolean
    onClose: (
      error?: SelectionError | undefined,
      item?: Item | undefined
    ) => void
  }>
  Provider?: FunctionComponent<{ children: ReactNode }>
  useGetCredentials?: UseGetCredentials
  useDownloadBook?: UseDownloadHook
  useRemoveBook?: UseRemoveBook | undefined
  useSyncSourceInfo?: UseSyncSourceInfo
}

export const generateResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string
) => `${uniqueResourceIdentifier}-${resourceId}`

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
