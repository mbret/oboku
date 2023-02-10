import { useContext } from "react"
import { GoogleAPIContext } from "./helpers"

export const useGoogle = () => useContext(GoogleAPIContext)
