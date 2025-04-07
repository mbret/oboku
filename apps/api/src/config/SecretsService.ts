import { Injectable } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import fs from "node:fs"

@Injectable()
export class SecretsService {
  private jwtPrivateKey: string | undefined
  private jwtPublicKey: string | undefined

  constructor(public appConfig: AppConfigService) {}

  async getJwtPrivateKey() {
    if (this.jwtPrivateKey) {
      return this.jwtPrivateKey
    }

    try {
      this.jwtPrivateKey = await fs.promises.readFile(
        this.appConfig.JWT_PRIVATE_KEY_FILE,
        "utf8",
      )

      return this.jwtPrivateKey
    } catch (error) {
      throw new Error(
        `Failed to read JWT private key file: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  async getJwtPublicKey() {
    if (this.jwtPublicKey) {
      return this.jwtPublicKey
    }

    try {
      this.jwtPublicKey = await fs.promises.readFile(
        this.appConfig.JWT_PUBLIC_KEY_FILE,
        "utf8",
      )

      return this.jwtPublicKey
    } catch (error) {
      throw new Error(
        `Failed to read JWT public key file: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }
}
