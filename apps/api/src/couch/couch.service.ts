import { Injectable } from "@nestjs/common"
import { AppConfigService } from "../config/AppConfigService"
import createNano from "nano"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"

export const emailToNameHex = (email: string) =>
  Buffer.from(email).toString("hex")

export const emailToUserDbName = (email: string) =>
  `userdb-${emailToNameHex(email)}`

export const emailToCouchUserDocId = (email: string) =>
  `org.couchdb.user:${email}`

@Injectable()
export class CouchService {
  constructor(
    private appConfigService: AppConfigService,
    private jwtService: JwtService,
    private secretsService: SecretsService,
  ) {}

  async generateJWT(payload: Record<string, unknown>) {
    return this.jwtService.signAsync(payload, {
      privateKey: await this.secretsService.getJwtPrivateKey(),
      algorithm: "RS256",
      expiresIn: "5m",
    })
  }

  async generateUserJWT(payload: { email: string; userId: number }) {
    return this.generateJWT({
      name: payload.email,
      sub: payload.email,
      userId: payload.userId,
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
    const jwt = await this.generateJWT({
      name: email,
      sub: email,
      "_couchdb.roles": [email],
    })

    const nano = this.createNanoInstance({ jwtToken: jwt })

    return nano.use(emailToUserDbName(email))
  }
}
