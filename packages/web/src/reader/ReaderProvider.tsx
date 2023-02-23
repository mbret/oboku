import { createContext, useContext, useMemo } from "react"
import { createReader } from "@prose-reader/core"
import { of } from "rxjs"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"
import { hammerGestureEnhancer } from "@prose-reader/enhancer-hammer-gesture"
import { Props as GenericReactReaderProps } from "@prose-reader/react"

export const createAppReader = hammerGestureEnhancer(createReader)

export type ReaderInstance = ReturnType<typeof createAppReader>

export type ReactReaderProps = GenericReactReaderProps<
  Parameters<typeof createAppReader>[0],
  ReaderInstance
>

export const ReaderContext = createContext<ReaderInstance | undefined>(
  undefined
)

export const useReader = () => {
  const reader = useContext(ReaderContext)
  const reader$ = useMemo(
    () => of(reader).pipe(isNotNullOrUndefined()),
    [reader]
  )
  return { reader, reader$ }
}
