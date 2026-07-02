import type {
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
  RefreshBookMetadataRequest,
  RefreshBookMetadataResponse,
  RefreshCollectionMetadataRequest,
  RefreshCollectionMetadataResponse,
  RefreshTokenResponse,
  RequestMagicLinkRequest,
  RequestMagicLinkResponse,
  RequestSignUpRequest,
  RequestSignUpResponse,
  SignInWithEmailRequest,
  SignInWithGoogleRequest,
  SyncDataSourceRequest,
  SyncDataSourceResponse,
} from "@oboku/shared"
import { configuration } from "../config/configuration"
import { HttpClientWeb } from "./httpClient.web"

class HttpApiClient extends HttpClientWeb {
  authWithMagicLink = (data: CompleteMagicLinkRequest) =>
    this.postOrThrow<CompleteMagicLinkResponse, CompleteMagicLinkRequest>(
      `${configuration.API_URL}/auth/magic-link/complete`,
      {
        body: data,
      },
    )

  refreshBookMetadata = (params: RefreshBookMetadataRequest) =>
    this.postOrThrow<RefreshBookMetadataResponse, RefreshBookMetadataRequest>(
      `${configuration.API_URL}/books/metadata/refresh`,
      {
        body: params,
      },
    )

  refreshCollectionMetadata = (params: RefreshCollectionMetadataRequest) =>
    this.postOrThrow<
      RefreshCollectionMetadataResponse,
      RefreshCollectionMetadataRequest
    >(`${configuration.API_URL}/collections/metadata/refresh`, {
      body: { ...params, soft: params.soft ?? false },
    })

  syncDataSource = (params: SyncDataSourceRequest) =>
    this.postOrThrow<SyncDataSourceResponse, SyncDataSourceRequest>(
      `${configuration.API_URL}/datasources/sync`,
      {
        body: params,
      },
    )

  signInWithEmail = (data: SignInWithEmailRequest) =>
    this.postOrThrow<AuthSessionResponse, SignInWithEmailRequest>(
      `${configuration.API_URL}/auth/signin/email`,
      {
        body: data,
      },
    )

  signInWithGoogle = (data: SignInWithGoogleRequest) =>
    this.postOrThrow<AuthSessionResponse, SignInWithGoogleRequest>(
      `${configuration.API_URL}/auth/signin/google`,
      {
        body: data,
      },
    )

  signUp = (data: RequestSignUpRequest) =>
    this.postOrThrow<RequestSignUpResponse, RequestSignUpRequest>(
      `${configuration.API_URL}/auth/signup`,
      {
        body: data,
      },
    )

  completeSignUp = (data: CompleteSignUpRequest) =>
    this.postOrThrow<CompleteSignUpResponse, CompleteSignUpRequest>(
      `${configuration.API_URL}/auth/signup/complete`,
      {
        body: data,
      },
    )

  requestMagicLink = (data: RequestMagicLinkRequest) =>
    this.postOrThrow<RequestMagicLinkResponse, RequestMagicLinkRequest>(
      `${configuration.API_URL}/auth/magic-link`,
      {
        body: data,
      },
    )

  markNotificationAsSeen = ({ id }: { id: number }) =>
    this.postOrThrow(`${configuration.API_URL}/notifications/${id}/seen`)

  markAllNotificationsAsSeen = () =>
    this.postOrThrow(`${configuration.API_URL}/notifications/seen`)

  archiveNotification = ({ id }: { id: number }) =>
    this.postOrThrow(`${configuration.API_URL}/notifications/${id}/archive`)

  refreshToken = ({
    refreshToken,
    useInterceptors = true,
  }: {
    refreshToken: string
    useInterceptors: boolean
  }) => {
    return this.postOrThrow<RefreshTokenResponse, never>(
      `${configuration.API_URL}/auth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        useInterceptors,
      },
    )
  }

  deleteAccount = () =>
    this.fetchOrThrow<DeleteAccountResponse>(
      `${configuration.API_URL}/auth/account`,
      {
        method: "DELETE",
      },
    )
}

export const httpClientApi = new HttpApiClient()
