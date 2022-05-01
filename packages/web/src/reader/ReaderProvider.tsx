import { createContext, useContext } from "react"
import { Reader } from "@prose-reader/core"

export const ReaderContext = createContext<Reader | undefined>(undefined)

export const useReader = () => useContext(ReaderContext)
