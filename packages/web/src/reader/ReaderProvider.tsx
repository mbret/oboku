import { createContext, useContext, useMemo } from "react"
import { Reader } from "@prose-reader/core"
import { of } from "rxjs"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"

export const ReaderContext = createContext<Reader | undefined>(undefined)

export const useReader = () => {
  const reader = useContext(ReaderContext)
  const reader$ = useMemo(
    () => of(reader).pipe(isNotNullOrUndefined()),
    [reader]
  )
  return { reader, reader$ }
}
