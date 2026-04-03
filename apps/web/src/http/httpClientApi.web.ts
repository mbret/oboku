import { configuration } from "../config/configuration"
import { HttpClientWeb } from "./httpClient.web"

class HttpApiClient extends HttpClientWeb {
  authWithMagicLink = (data: { token: string }) =>
    this.post<
      {
        dbName: string
        email: string
        accessToken: string
        refreshToken: string
        nameHex: string
      },
      typeof data
    >(`${configuration.API_URL}/auth/magic-link/complete`, {
      body: data,
    })

  refreshBookMetadata = (params: {
    bookId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.post(`${configuration.API_URL}/books/metadata/refresh`, {
      body: params,
    })

  refreshCollectionMetadata = (params: {
    collectionId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.post(`${configuration.API_URL}/collections/metadata/refresh`, {
      body: { ...params, soft: false },
    })

  syncDataSource = (params: {
    dataSourceId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.post(`${configuration.API_URL}/datasources/sync`, {
      body: params,
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

  signUp = (data: { email: string }) =>
    this.post<unknown, typeof data>(`${configuration.API_URL}/auth/signup`, {
      body: data,
    })

  completeSignUp = (data: { token: string; password: string }) =>
    this.post<{ email: string }, typeof data>(
      `${configuration.API_URL}/auth/signup/complete`,
      {
        body: data,
      },
    )

  requestMagicLink = (data: { email: string }) =>
    this.post<unknown, typeof data>(
      `${configuration.API_URL}/auth/magic-link`,
      {
        body: data,
      },
    )

  markNotificationAsSeen = ({ id }: { id: number }) =>
    this.post(`${configuration.API_URL}/notifications/${id}/seen`)

  markAllNotificationsAsSeen = () =>
    this.post(`${configuration.API_URL}/notifications/seen`)

  archiveNotification = ({ id }: { id: number }) =>
    this.post(`${configuration.API_URL}/notifications/${id}/archive`)

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

  deleteAccount = () =>
    this.fetch(`${configuration.API_URL}/auth/account`, {
      method: "DELETE",
    })
}

export const httpClientApi = new HttpApiClient()
