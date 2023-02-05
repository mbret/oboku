import { MouseEvent, useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

export const useModalNavigationControl = (
  { onExit }: { onExit: () => void },
  /**
   * Make sure the value is consistent for the same rendered dialog.
   * Usually isOpened or the id given to the dialog is ok.
   */
  id: string | boolean | undefined
) => {
  const navigate = useNavigate()
  const [currentHash, setCurrentHash] = useState<string | undefined>(undefined)
  const closeCb = useRef<() => void>()

  useEffect(() => {
    const onHashChange = () => {
      if (currentHash && window.location.hash !== currentHash) {
        onExit()
        closeCb.current && closeCb.current()
        closeCb.current = undefined
        setCurrentHash(undefined)
      }
    }

    window.addEventListener("hashchange", onHashChange, false)

    return () => {
      window.removeEventListener("hashchange", onHashChange, false)
    }
  }, [onExit, currentHash, setCurrentHash])

  useEffect(() => {
    const hash = `#modal-${uuidv4()}`

    if (id) {
      navigate(hash)
      setCurrentHash(hash)
    }
  }, [id, navigate])

  const close = useCallback(
    (cb?: (() => void) | MouseEvent) => {
      if (typeof cb === "function") {
        closeCb.current = cb
      }
      // Here we want to navigate first so that any heavy stuff that
      // might happens in the callback will not slow down dialog
      // closing process
      navigate(-1)
    },
    [navigate]
  )

  return { closeModalWithNavigation: close }
}
