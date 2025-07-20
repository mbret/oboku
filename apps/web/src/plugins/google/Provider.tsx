import { memo, useEffect } from "react"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import type { ObokuPlugin } from "../types"
import { useLoadGapi } from "./lib/gapi"
import { useSignalValue } from "reactjrx"
import { consentShownSignal } from "../../google/auth"
import "./lib/picker.css"

export const Provider: ObokuPlugin["Provider"] = memo(({ children }) => {
  const consentPopupShown = useSignalValue(consentShownSignal)

  const { mutate: loadGapi } = useLoadGapi()

  useEffect(() => {
    loadGapi()
  }, [loadGapi])

  return (
    <>
      {children}
      {!!consentPopupShown && <BlockingScreen />}
    </>
  )
})
