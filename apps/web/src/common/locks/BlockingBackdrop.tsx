import { useEffect, useState } from "react"
import { Backdrop, CircularProgress, useTheme } from "@mui/material"
import { useSignalValue } from "reactjrx"
import { lockState } from "./utils"

const useIsLockedState = () => {
  return !!useSignalValue(lockState).length
}

export const BlockingBackdrop = () => {
  const isOpen = useIsLockedState()
  const [active, setActive] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let alreadyOverdue = false

    if (isOpen) {
      setActive(true)
      setTimeout(() => {
        alreadyOverdue = true
      }, 300)
    } else {
      if (alreadyOverdue) {
        setActive(false)
      } else {
        timeout = setTimeout(() => {
          setActive(false)
        }, 300)
      }
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [isOpen])

  return (
    <Backdrop
      open={active}
      sx={{
        zIndex: theme.zIndex.tooltip + 1,
        color: "#fff",
      }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}
