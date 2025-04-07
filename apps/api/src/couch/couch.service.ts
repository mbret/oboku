import { Injectable } from "@nestjs/common"
import { AppConfigService } from "../config/AppConfigService"
import createNano from "nano"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"

@Injectable()
export class CouchService {
  constructor(
    private appConfigService: AppConfigService,
    private jwtService: JwtService,
    private secretsService: SecretsService,
  ) {}

  async generateJWT(payload: Record<string, unknown>) {
    // Set expiration to a very distant future date (100 years from now)
    const farFutureDate =
      Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 100

    return this.jwtService.signAsync(payload, {
      privateKey: await this.secretsService.getJwtPrivateKey(),
      algorithm: "RS256",
      // @todo
      expiresIn: farFutureDate,
      // expiresIn: "10s",
    })
  }

  async generateUserJWT(payload: {
    email: string
  }) {
    return this.generateJWT({
      name: payload.email,
      sub: payload.email,
      "_couchdb.roles": [payload.email],
    })
  }

  async generateAdminJWT() {
    return this.generateJWT({
      name: "admin",
      sub: "admin",
      "_couchdb.roles": ["_admin"],
    })
  }

  createNanoInstance = ({ jwtToken }: { jwtToken?: string }) => {
    return createNano({
      url: this.appConfigService.COUCH_DB_URL,
      requestDefaults: {
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
      },
    })
  }

  createAdminNanoInstance = async () => {
    const jwt = await this.generateAdminJWT()
    return this.createNanoInstance({ jwtToken: jwt })
  }

  createNanoInstanceForUser = async ({ email }: { email: string }) => {
    const hexEncodedUserId = Buffer.from(email).toString("hex")
    const jwt = await this.generateUserJWT({ email })

    const nano = this.createNanoInstance({ jwtToken: jwt })

    return nano.use(`userdb-${hexEncodedUserId}`)
  }
}
