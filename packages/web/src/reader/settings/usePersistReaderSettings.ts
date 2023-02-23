import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { tap } from "rxjs"
import { useReader } from "../ReaderProvider"
import { readerSettingsState } from "./states"

export const usePersistReaderSettings = () => {
  const { reader } = useReader()
  const setSettings = useSetRecoilState(readerSettingsState)

  useEffect(() => {
    const sub = reader?.settings$
      .pipe(
        tap((settings) => {
          setSettings((state) => ({
            ...state,
            fontScale: settings.fontScale
          }))
        })
      )
      .subscribe()

    return () => sub?.unsubscribe()
  }, [reader, setSettings])
}
