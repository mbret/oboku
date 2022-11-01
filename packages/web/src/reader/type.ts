import { ComponentProps } from "react"
import type { Reader as ObokuReader } from "@prose-reader/react"
import { Props as ReactReaderGenericProps } from "@prose-reader/react"
import { ComposeEnhancer } from "@prose-reader/core"

type AppEnhancer = ComposeEnhancer

export type Pagination = Parameters<
  NonNullable<ComponentProps<typeof ObokuReader>["onPaginationChange"]>
>[0]
export type ReactReaderProps = ReactReaderGenericProps<AppEnhancer>
export type ReactReaderOptions = NonNullable<ReactReaderProps[`options`]>
export type ReactReaderLoadOptions = NonNullable<
  ReactReaderProps[`loadOptions`]
>
