import { createContext, useContext } from "react";
import { Reader } from "@oboku/reader";

export const ReaderContext = createContext<Reader | undefined>(undefined)

export const useReader = () => useContext(ReaderContext)