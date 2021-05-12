export { Manifest } from './types'

import { createReaderWithEnhancers as createReader } from './createReader'

export type Reader = ReturnType<typeof createReader>
export type Pagination = ReturnType<ReturnType<typeof createReader>['getPaginationInfo']>
export type ReaderPublicApi = ReturnType<typeof createReader>

export {
  createReader
}