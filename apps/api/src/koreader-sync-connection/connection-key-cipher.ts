import { hkdfSync } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { SecretsService } from "../config/SecretsService.js"
import { decryptAes256Gcm, encryptAes256Gcm } from "../lib/crypto/aes256Gcm.js"

const ENCRYPTION_KEY_INFO = "oboku/koreader-sync-connection/key"
const ENCRYPTION_KEY_BYTES = 32

/**
 * Encrypts the keys of KOReader sync connections at rest, under a key derived
 * from the JWT private key. Replacing the JWT private key leaves the stored
 * keys unreadable, and users sign in to their sync server again.
 */
@Injectable()
export class KoreaderSyncConnectionKeyCipher {
  private encryptionKey: Buffer | undefined

  constructor(private readonly secretsService: SecretsService) {}

  private async getEncryptionKey() {
    if (!this.encryptionKey) {
      const jwtPrivateKey = await this.secretsService.getJwtPrivateKey()

      this.encryptionKey = Buffer.from(
        hkdfSync(
          "sha256",
          jwtPrivateKey,
          "",
          ENCRYPTION_KEY_INFO,
          ENCRYPTION_KEY_BYTES,
        ),
      )
    }

    return this.encryptionKey
  }

  async encrypt(key: string) {
    return encryptAes256Gcm(key, await this.getEncryptionKey())
  }

  /** `null` when the JWT private key changed since `encryptedKey` was made. */
  async decrypt(encryptedKey: string) {
    return decryptAes256Gcm(encryptedKey, await this.getEncryptionKey())
  }
}
