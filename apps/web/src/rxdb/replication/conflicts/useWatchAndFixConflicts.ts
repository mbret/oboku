// import { useSignalValue } from "reactjrx"
// import { authStateSignal } from "../../../auth/authState"
// import { useNetworkState } from "react-use"
// import { useEffect } from "react"
// import { API_COUCH_URI } from "../../../constants.shared"

const useWatchForLiveConflicts = () => {
  //   const { online } = useNetworkState()
  //   const { token, dbName } = useSignalValue(authStateSignal) || {}
  //   useEffect(() => {
  //     if (!token || !dbName || !online)
  //       return // @todo retry automatically in case of failure
  //     ;(async () => {
  //       const response = await fetch(
  //         `${API_COUCH_URI}${dbName}/_changes?include_docs=true&&since=0&feed=longpoll&conflicts=true&heartbeat=10000&limit=25`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`
  //           }
  //         }
  //       )
  //       const data = await response.json()
  //       console.log({ data })
  //     })()
  //     return () => {}
  //   }, [dbName, token, online])
}

export const useWatchAndFixConflicts = () => {
  useWatchForLiveConflicts()
}
