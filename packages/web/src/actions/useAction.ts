import { useCallback } from "react"
import { actionSubject$ } from "./actionSubject$"
import { Action } from "./types"

export const useAction = () => {
  // const [action, setAction] = useRecoilState(actionState)
  // const firstRun = useRef(true)

  // const returnedAction = firstRun.current ? undefined : action

  // firstRun.current = false

  const execute = useCallback((action: Action) => {
    // setAction({
    //   ...action
    // })
    console.log(`execute`, action)
    actionSubject$.next(action)
  }, [])

  return {
    execute
    // action
  }
}
