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
      if (this.appConfig.JWT_PRIVATE_KEY) {
        this.jwtPrivateKey = atob(this.appConfig.JWT_PRIVATE_KEY)
      } else if (this.appConfig.JWT_PRIVATE_KEY_FILE) {
        this.jwtPrivateKey = await fs.promises.readFile(
          this.appConfig.JWT_PRIVATE_KEY_FILE,
          "utf8",
        )
      } else {
        throw new Error(
          "Neither JWT_PRIVATE_KEY nor JWT_PRIVATE_KEY_FILE is defined",
        )
      }

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
      if (this.appConfig.JWT_PUBLIC_KEY) {
        this.jwtPublicKey = atob(this.appConfig.JWT_PUBLIC_KEY)
      } else if (this.appConfig.JWT_PUBLIC_KEY_FILE) {
        this.jwtPublicKey = await fs.promises.readFile(
          this.appConfig.JWT_PUBLIC_KEY_FILE,
          "utf8",
        )
      } else {
        throw new Error(
          "Neither JWT_PUBLIC_KEY nor JWT_PUBLIC_KEY_FILE is defined",
        )
      }

      return this.jwtPublicKey
    } catch (error) {
      throw new Error(
        `Failed to read JWT public key: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }
}
