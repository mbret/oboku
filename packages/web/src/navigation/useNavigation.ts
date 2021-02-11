import { useCallback, useMemo } from "react"
import { useHistory } from "react-router-dom"
import { ROUTES } from "../constants"

export const useNavigation = () => {
  const history = useHistory()

  const goBack = useCallback(() => {
    if (window.history.state === null && history.location.pathname !== ROUTES.HOME) {
      history.replace(ROUTES.HOME)
    } else {
      history.goBack()
    }
  }, [history])

  return useMemo(() => ({ history, goBack }), [history, goBack])
}