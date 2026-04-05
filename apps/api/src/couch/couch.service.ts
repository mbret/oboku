import { Injectable } from "@nestjs/common"
import { AppConfigService } from "../config/AppConfigService"
import createNano from "nano"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"
import type { StringValue } from "ms"

export const emailToNameHex = (email: string) =>
  Buffer.from(email).toString("hex")

export const emailToUserDbName = (email: string) =>
  `userdb-${emailToNameHex(email)}`

export const emailToCouchUserDocId = (email: string) =>
  `org.couchdb.user:${email}`

// End-user Couch access tokens are short-lived so refresh-session revocation
// takes effect quickly.
const COUCH_USER_ACCESS_TOKEN_TTL = "5m"

// Internal server-side Couch clients have no refresh path and may be reused by
// long-running jobs such as migrations and cleanups.
const COUCH_INTERNAL_SERVER_TOKEN_TTL = "7d"

@Injectable()
export class CouchService {
  constructor(
    private appConfigService: AppConfigService,
    private jwtService: JwtService,
    private secretsService: SecretsService,
  ) {}

  private async generateJWT({
    payload,
    expiresIn,
  }: {
    payload: Record<string, unknown>
    expiresIn: StringValue
  }) {
    return this.jwtService.signAsync(payload, {
      privateKey: await this.secretsService.getJwtPrivateKey(),
      algorithm: "RS256",
      expiresIn,
    })
  }

  private async generateInternalJWT(payload: Record<string, unknown>) {
    return this.generateJWT({
      payload,
      expiresIn: COUCH_INTERNAL_SERVER_TOKEN_TTL,
    })
  }

  async generateUserJWT(payload: { email: string; userId: number }) {
    return this.generateJWT({
      payload: {
        name: payload.email,
        sub: payload.email,
        userId: payload.userId,
        "_couchdb.roles": [payload.email],
      },
      expiresIn: COUCH_USER_ACCESS_TOKEN_TTL,
    })
  }

  async generateAdminJWT() {
    return this.generateInternalJWT({
      name: "admin",
      sub: "admin",
      "_couchdb.roles": ["_admin"],
    })
  }

  createNanoInstance = ({ jwtToken }: { jwtToken?: string }) => {
    return createNano({
      url: this.appConfigService.COUCH_DB_URL,
      headers: {
        "content-type": "application/json",
        ...(this.appConfigService.config.get("TMP_X_ACCESS_SECRET", {
          infer: true,
        }) && {
          "x-access-secret": this.appConfigService.config.get(
            "TMP_X_ACCESS_SECRET",
            { infer: true },
          ),
        }),
        accept: "application/json",
        ...(jwtToken && {
          Authorization: `Bearer ${jwtToken}`,
        }),
      },
    })
  }

  createAdminNanoInstance = async () => {
    const jwt = await this.generateAdminJWT()
    return this.createNanoInstance({ jwtToken: jwt })
  }

  createNanoInstanceForUser = async ({ email }: { email: string }) => {
    const jwt = await this.generateInternalJWT({
      name: email,
      sub: email,
      "_couchdb.roles": [email],
    })

    const nano = this.createNanoInstance({ jwtToken: jwt })

    return nano.use(emailToUserDbName(email))
  }
}
