import { Injectable } from "@nestjs/common"
import { AppConfigService } from "../features/config/AppConfigService"
import * as createNano from "nano"
import { JwtService } from "@nestjs/jwt"

@Injectable()
export class CouchService {
  constructor(
    private appConfigService: AppConfigService,
    private jwtService: JwtService,
  ) {}

  async generateJWT(payload: Record<string, unknown>) {
    return this.jwtService.sign(payload, {
      privateKey: this.appConfigService.JWT_PRIVATE_KEY,
      algorithm: "RS256",
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
