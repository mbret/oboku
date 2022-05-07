import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

export const useModalNavigationControl = (
  { onExit }: { onExit: () => void },
  id: string | undefined
) => {
  const navigate = useNavigate()
  const [currentHash, setCurrentHash] = useState<string | undefined>(undefined)

  useEffect(() => {
    const onHashChange = () => {
      if (currentHash && window.location.hash !== currentHash) {
        onExit()
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

  return useCallback(
    (cb?: () => void) => {
      // Here we want to navigate first so that any heavy stuff that
      // might happens in the callback will not slow down dialog
      // closing process
      navigate(-1)
      setTimeout(() => {
        cb && cb()
      })
    },
    [navigate]
  )
}
