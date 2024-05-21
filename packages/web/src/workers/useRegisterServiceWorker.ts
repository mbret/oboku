import { useEffect, useRef, useState } from "react"
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"

export const useRegisterServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | undefined>(
    undefined
  )
  const firstTime = useRef(true)

  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false
      serviceWorkerRegistration.register({
        onSuccess: () => console.warn("onSuccess"),
        onUpdate: (reg) => reg.waiting && setWaitingWorker(reg.waiting),
        onWaitingServiceWorkerFound: async (reg) => {
          reg.waiting && setWaitingWorker(reg.waiting)
        }
      })
    }
  }, [])

  return { waitingWorker }
}
