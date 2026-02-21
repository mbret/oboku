import { useEffect, useState } from "react"
import { Subject } from "rxjs"

export const useUnmountSubject = () => {
  const [unmountSubject] = useState(() => new Subject<void>())

  useEffect(() => {
    return () => {
      unmountSubject.next()
    }
  }, [unmountSubject])

  return unmountSubject
}
