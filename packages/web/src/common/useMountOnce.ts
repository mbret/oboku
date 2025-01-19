import { useEffect } from "react"

import { useRef } from "react"

export const useMountOnce = (fn: () => void) => {
  const isMounted = useRef(false)

  useEffect(() => {
    if (isMounted.current) return
    isMounted.current = true
    fn()
  }, [fn])
}
