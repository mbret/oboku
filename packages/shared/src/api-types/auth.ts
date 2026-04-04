export type EmptyResponse = Record<string, never>

export type AuthTokensResponse = {
  accessToken: string
  refreshToken: string
}

export type AuthSessionResponse = AuthTokensResponse & {
  dbName: string
  email: string
  nameHex: string
}

export type SignInWithEmailRequest = {
  email: string
  password: string
  installation_id: string
}

export type SignInWithGoogleRequest = {
  token: string
  installation_id: string
}

export type SignInRequest = SignInWithEmailRequest | SignInWithGoogleRequest

export type RequestSignUpRequest = {
  email: string
}

export type RequestSignUpResponse = EmptyResponse

export type CompleteSignUpRequest = {
  token: string
  password: string
}

export type CompleteSignUpResponse = {
  email: string
}

export type RequestMagicLinkRequest = {
  email: string
}

export type RequestMagicLinkResponse = EmptyResponse

export type CompleteMagicLinkRequest = {
  token: string
  installation_id: string
}

export type CompleteMagicLinkResponse = AuthSessionResponse

export type RefreshTokenResponse = AuthTokensResponse

export type DeleteAccountResponse = EmptyResponse
