import { useCallback } from "react"

export const useConfirmation = () =>
  useCallback(() => {
    return window.confirm(`Are you sure?`)
  }, [])
