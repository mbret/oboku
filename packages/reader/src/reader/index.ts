import { createPublicApi } from './publicApi'
import { createReader as createInternalReader } from './reader'

export { Manifest } from './types'

export type Pagination = ReturnType<ReturnType<typeof createReader>['getPagination']>

export const createReader = ({ containerElement }: {
  containerElement: HTMLElement
}) => {
  const reader = createInternalReader({ containerElement })
  const publicApi = createPublicApi(reader)

  return publicApi
}

export type Reader = ReturnType<typeof createReader>