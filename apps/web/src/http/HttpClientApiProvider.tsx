import { createContext, type ReactNode, useContext, useState } from "react"
import { createHttpClientApi, type HttpApiClient } from "./httpClientApi.web"

const HttpClientApiContext = createContext<HttpApiClient | undefined>(undefined)

export const HttpClientApiProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [client] = useState(createHttpClientApi)

  return (
    <HttpClientApiContext.Provider value={client}>
      {children}
    </HttpClientApiContext.Provider>
  )
}

export const useHttpClientApi = () => {
  const client = useContext(HttpClientApiContext)

  if (!client) {
    throw new Error(
      "useHttpClientApi must be used within a HttpClientApiProvider",
    )
  }

  return client
}
