import { createContext, type ReactNode, useContext, useState } from "react"
import { authStateSignal } from "../auth/states.web"
import { HttpApiClientWeb } from "./HttpClientApi.web"

const HttpClientApiContext = createContext<HttpApiClientWeb | undefined>(
  undefined,
)

export const HttpClientApiProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [client] = useState(
    () =>
      new HttpApiClientWeb({
        getSession: () => authStateSignal.getValue(),
        setSession: (session) => authStateSignal.update(session),
      }),
  )

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
