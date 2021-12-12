import { ComponentProps } from 'react'
import type { Reader as ObokuReader } from '@prose-reader/react'

export type Pagination = Parameters<NonNullable<ComponentProps<typeof ObokuReader>['onPaginationChange']>>[0]
