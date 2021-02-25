import localforage from 'localforage'
import { useEffect, useMemo, useState } from 'react'

export const useDownloadedFilesInfo = () => {
  const [keys, setKeys] = useState<string[]>([])
  const [refetch, setRefetch] = useState(0)

  useEffect(() => {
    (async () => {
      const keys = await localforage.keys()
      const bookDownloadKeys = keys.filter(name => name.startsWith(`book-download`)).map(name => name.replace(`book-download-`, ``))
      setKeys(bookDownloadKeys)
    })()
  }, [refetch])

  return useMemo(() => ({
    bookIds: keys,
    refetch: () => setRefetch(old => old + 1)
  }), [keys])
}