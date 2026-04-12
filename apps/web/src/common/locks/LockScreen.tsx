import { useEffect } from "react"
import { lock } from "./utils"

export const LockScreen = () => {
  useEffect(() => {
    return lock()
  }, [])

  return null
}
