import type {
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
  RefreshTokenResponse,
  RequestMagicLinkRequest,
  RequestMagicLinkResponse,
  RequestSignUpRequest,
  RequestSignUpResponse,
  SignInRequest,
} from "@oboku/shared"
import { configuration } from "../config/configuration"
import { HttpClientWeb } from "./httpClient.web"

class HttpApiClient extends HttpClientWeb {
  authWithMagicLink = (data: CompleteMagicLinkRequest) =>
    this.post<CompleteMagicLinkResponse, CompleteMagicLinkRequest>(
      `${configuration.API_URL}/auth/magic-link/complete`,
      {
        body: data,
      },
    )

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

  signIn = (data: SignInRequest) =>
    this.post<AuthSessionResponse, SignInRequest>(
      `${configuration.API_URL}/auth/signin`,
      {
        body: data,
      },
    )

  signUp = (data: RequestSignUpRequest) =>
    this.post<RequestSignUpResponse, RequestSignUpRequest>(
      `${configuration.API_URL}/auth/signup`,
      {
        body: data,
      },
    )

  completeSignUp = (data: CompleteSignUpRequest) =>
    this.post<CompleteSignUpResponse, CompleteSignUpRequest>(
      `${configuration.API_URL}/auth/signup/complete`,
      {
        body: data,
      },
    )

  requestMagicLink = (data: RequestMagicLinkRequest) =>
    this.post<RequestMagicLinkResponse, RequestMagicLinkRequest>(
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
    return this.post<RefreshTokenResponse, never>(
      `${configuration.API_URL}/auth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        useInterceptors,
      },
    )
  }

  deleteAccount = () =>
    this.fetch<DeleteAccountResponse>(`${configuration.API_URL}/auth/account`, {
      method: "DELETE",
    })
}

export const httpClientApi = new HttpApiClient()
