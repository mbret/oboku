import { ComponentProps } from 'react'
import type { Reader as ObokuReader } from '@oboku/reader-react'

export type Pagination = Parameters<NonNullable<ComponentProps<typeof ObokuReader>['onPaginationChange']>>[0]
