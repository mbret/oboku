import { createReader } from "@prose-reader/core"
import { Props as GenericReactReaderProps } from "@prose-reader/react"

export type ReaderInstance = ReturnType<typeof createReader>

export type ReactReaderProps = GenericReactReaderProps<
  Parameters<typeof createReader>[0],
  ReturnType<typeof createReader>
>
