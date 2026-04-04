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
  SignInWithEmailRequest,
  SignInWithGoogleRequest,
} from "@oboku/shared"
import { configuration } from "../config/configuration"
import { HttpClientWeb } from "./httpClient.web"
import { injectToken } from "./injectToken.web"

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

  signInWithEmail = (data: SignInWithEmailRequest) =>
    this.post<AuthSessionResponse, SignInWithEmailRequest>(
      `${configuration.API_URL}/auth/signin/email`,
      {
        body: data,
      },
    )

  signInWithGoogle = (data: SignInWithGoogleRequest) =>
    this.post<AuthSessionResponse, SignInWithGoogleRequest>(
      `${configuration.API_URL}/auth/signin/google`,
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

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useRequestInterceptor(injectToken)
