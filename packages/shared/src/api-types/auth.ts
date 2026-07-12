export type EmptyResponse = Record<string, never>

export type AuthSessionResponse = {
  dbName: string
  email: string
  nameHex: string
}

/**
 * Public ECDSA P-256 JWK the client registers alongside its refresh session
 * (sender-constrained refresh): later refreshes must present a proof signed
 * by the matching private key. Structurally compatible with the DOM's
 * `JsonWebKey`.
 */
export type AuthProofPublicKeyJwk = {
  kty?: string
  crv?: string
  x?: string
  y?: string
  alg?: string
  ext?: boolean
  key_ops?: string[]
  use?: string
}

export type SignInWithEmailRequest = {
  email: string
  password: string
  installation_id: string
  public_key: AuthProofPublicKeyJwk
}

export type SignInWithGoogleRequest = {
  token: string
  installation_id: string
  public_key: AuthProofPublicKeyJwk
}

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
  public_key: AuthProofPublicKeyJwk
}

export type CompleteMagicLinkResponse = AuthSessionResponse

export type RefreshTokenResponse = EmptyResponse

export type LogoutResponse = EmptyResponse

export type DeleteAccountResponse = EmptyResponse
