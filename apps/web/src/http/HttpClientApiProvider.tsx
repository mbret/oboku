import { memo, type ReactNode, useState } from "react"
import { HttpApiClientWeb } from "./HttpClientApi.web"
import { HttpClientApiContext } from "./HttpClientApiContext"

export const HttpClientApiProvider = memo(function HttpClientApiProvider({
  children,
}: {
  children: ReactNode
}) {
  const [httpClientApi] = useState(() => new HttpApiClientWeb())

  return (
    <HttpClientApiContext.Provider value={httpClientApi}>
      {children}
    </HttpClientApiContext.Provider>
  )
})
