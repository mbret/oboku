import { createContext, useContext } from "react"
import type { HttpApiClientWeb } from "./HttpClientApi.web"

export const HttpClientApiContext = createContext<HttpApiClientWeb | undefined>(
  undefined,
)

export const useHttpClientApi = () => {
  const client = useContext(HttpClientApiContext)

  if (!client) {
    throw new Error(
      "useHttpClientApi must be used within the HttpClientApiProvider tree",
    )
  }

  return client
}
