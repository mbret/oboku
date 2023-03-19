import { useState } from "react"
import { Observable } from "rxjs"
import { Report } from "../debug/report.shared"

export const useMutation = <Fn extends (...args: any[]) => Observable<any>>(
  fn: Fn
) => {
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(undefined)
  const [error, setError] = useState<unknown | undefined>(undefined)

  const mutate = (...args) => {
    setIsLoading(true)
    setError(undefined)
    setIsCompleted(false)
    setData(undefined)

    return fn(...args).subscribe({
      complete: () => {
        setIsLoading(false)
        setIsCompleted(true)
      },
      error: (error) => {
        Report.error(error)

        setIsLoading(false)
        setError(error)
      },
      next: (data) => setData(data)
    })
  }

  return { mutate, isCompleted, data, error, isLoading }
}
