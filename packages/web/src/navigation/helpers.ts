import { useCallback, useEffect, useState } from "react"
import { useHistory } from "react-router-dom"
import { v4 as uuidv4 } from 'uuid'

export const useModalNavigationControl = ({ onExit }: { onExit: () => void }, id: string | undefined) => {
  const history = useHistory()
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
      history.push(hash)
      setCurrentHash(hash)
    }
  }, [id, history])

  return useCallback((cb?: () => void) => {
    const unlisten = history.listen(() => {
      unlisten()
      cb && cb()
    })
    history.goBack()
  }, [history])
}