import { useEffect, useState } from "react"
import { Observable } from "rxjs"

export const useSubscribe$ = <T>(observable?: Observable<T>) => {
  const [data, setData] = useState<T | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sub = observable?.subscribe((data) => {
      setIsLoading(false)
      setData(data)
    })

    return () => {
      sub?.unsubscribe()
    }
  }, [observable])

  return { data, isLoading }
}
