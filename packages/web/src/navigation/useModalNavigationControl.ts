import { MouseEvent, useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"

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
  const { state } = useLocation()
  const modalHash: string | undefined = state && state.__oboku_modal
  const [synced, setSynced] = useState(false)
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit

  useEffect(() => {
    if (currentHash && synced && currentHash !== modalHash) {
      setCurrentHash(undefined)
      setSynced(false)
      onExitRef.current()
      closeCb.current && closeCb.current()
      closeCb.current = undefined
    }
  }, [currentHash, setCurrentHash, modalHash, synced])

  useEffect(() => {
    if (currentHash && currentHash === modalHash) {
      setSynced(true)
    }
  }, [currentHash, modalHash])

  useEffect(() => {
    if (id) {
      const hash = `#modal-${crypto.randomUUID()}`

      setCurrentHash(hash)

      navigate(
        {
          hash: window.location.hash,
          search: window.location.search,
          pathname: window.location.pathname
        },
        { state: { __oboku_modal: hash } }
      )
    } else {
      setCurrentHash(undefined)
    }
  }, [id, navigate])

  const close = useCallback(
    (cb?: (() => void) | MouseEvent) => {
      closeCb.current = undefined
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
