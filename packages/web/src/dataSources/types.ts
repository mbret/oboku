import { LinkDocType } from "@oboku/shared";

export type UseDownloadHook = () => (link: LinkDocType, options?: {
  onDownloadProgress: (event: ProgressEvent, totalSize: number) => void
}) => Promise<{
  data: Blob | File,
  name: string
} | {
  isError: true,
  error?: Error,
  reason: 'unknown' | 'cancelled' | 'popupBlocked'
}>

export type UseGetCredentials = () => () => Promise<{
  isError: true,
  error?: Error,
  reason: 'unknown' | 'cancelled' | 'popupBlocked'
} | {
  data: { [key: string]: string }
}>