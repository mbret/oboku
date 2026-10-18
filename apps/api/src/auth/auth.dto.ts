import { Type } from "class-transformer"
import {
  Equals,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator"

/**
 * The exact P-256 JWK shape needed to compute an RFC 7638 thumbprint at
 * refresh. Anything looser would bind a session that signs in fine but can
 * never refresh. Coordinate lengths are a lax bound (P-256 encodes to 43
 * base64url chars) that mainly keeps the stored key small.
 */
export class AuthProofPublicKeyDto {
  @Equals("EC")
  kty!: string

  @Equals("P-256")
  crv!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  x!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  y!: string
}

export class RequestSignUpDto {
  @IsEmail()
  email!: string
}

export class RequestMagicLinkDto {
  @IsEmail()
  email!: string
}

export class CompleteSignUpDto {
  @IsNotEmpty()
  token!: string

  @IsNotEmpty()
  @MinLength(8)
  password!: string
}

export class CompleteMagicLinkDto {
  @IsNotEmpty()
  token!: string

  @IsNotEmpty()
  installation_id!: string

  @IsObject()
  @ValidateNested()
  @Type(() => AuthProofPublicKeyDto)
  public_key!: AuthProofPublicKeyDto
}

export class SignInWithEmailDto {
  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  password!: string

  @IsString()
  @IsNotEmpty()
  installation_id!: string

  @IsObject()
  @ValidateNested()
  @Type(() => AuthProofPublicKeyDto)
  public_key!: AuthProofPublicKeyDto
}

export class SignInWithGoogleDto {
  @IsString()
  @IsNotEmpty()
  token!: string

  @IsString()
  @IsNotEmpty()
  installation_id!: string

  @IsObject()
  @ValidateNested()
  @Type(() => AuthProofPublicKeyDto)
  public_key!: AuthProofPublicKeyDto
}

export class RefreshTokenQueryDto {
  @IsString()
  @IsNotEmpty()
  grant_type!: "refresh_token"
}

export class LogoutDto {
  @IsUUID()
  session_id!: string
}

export class AuthSessionResponseDto {
  dbName!: string
  email!: string
  nameHex!: string
  /**
   * Non-secret identity minted fresh for this sign-in. The client stores it on
   * the session and later presents it to `logout` to revoke exactly this
   * session, regardless of which refresh cookie currently sits in the jar.
   */
  sessionId!: string
}

export class CompleteSignUpResponseDto {
  email!: string
}
