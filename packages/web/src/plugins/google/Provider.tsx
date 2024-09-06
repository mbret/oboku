import { memo, useEffect } from "react"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { ObokuPlugin } from "../types"
import { useLoadGapi } from "./lib/gapi"
import { useLoadGsi } from "./lib/gsi"
import { useSignalValue } from "reactjrx"
import { consentShownSignal } from "./lib/auth"

export const Provider: ObokuPlugin["Provider"] = memo(({ children }) => {
  const consentPopupShown = useSignalValue(consentShownSignal)

  const { mutate: loadGapi } = useLoadGapi()
  const { mutate: loadGsi } = useLoadGsi()

  useEffect(() => {
    loadGapi()
    loadGsi()
  }, [loadGapi, loadGsi])

  return (
    <>
      {children}
      {!!consentPopupShown && <BlockingScreen />}
    </>
  )
})
