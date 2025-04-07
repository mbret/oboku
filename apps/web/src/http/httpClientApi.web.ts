import { configuration } from "../config/configuration"
import { HttpClientWeb } from "./httpClient.web"

class HttpApiClient extends HttpClientWeb {
  refreshBookMetadata = (
    bookId: string,
    credentials?: { [key: string]: any },
  ) =>
    this.post(`${configuration.API_URL}/books/metadata/refresh`, {
      body: { bookId },
      headers: {
        "oboku-credentials": JSON.stringify(credentials ?? {}),
      },
    })

  refreshCollectionMetadata = (
    collectionId: string,
    credentials?: { [key: string]: any },
  ) =>
    this.post(`${configuration.API_URL}/collections/metadata/refresh`, {
      body: { collectionId },
      headers: {
        "oboku-credentials": JSON.stringify(credentials ?? {}),
      },
    })

  syncDataSource = (dataSourceId: string, data?: Record<string, unknown>) =>
    this.post(`${configuration.API_URL}/datasources/sync`, {
      body: { dataSourceId, data },
    })

  signIn = (data: { email: string; password: string } | { token: string }) =>
    this.post<
      {
        dbName: string
        email: string
        accessToken: string
        refreshToken: string
        nameHex: string
      },
      typeof data
    >(`${configuration.API_URL}/auth/signin`, {
      body: data,
    })

  signUp = (data: { email: string; password: string }) =>
    this.post<unknown, typeof data>(`${configuration.API_URL}/auth/signup`, {
      body: data,
    })

  refreshToken = ({
    refreshToken,
    useInterceptors = true,
  }: {
    refreshToken: string
    useInterceptors: boolean
  }) => {
    return this.post<
      {
        accessToken: string
        refreshToken: string
      },
      never
    >(
      `${configuration.API_URL}/auth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        useInterceptors,
      },
    )
  }
}

export const httpClientApi = new HttpApiClient()
