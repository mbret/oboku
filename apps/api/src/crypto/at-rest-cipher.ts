import { hkdfSync } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { SecretsService } from "../config/SecretsService.js"
import { decryptAes256Gcm, encryptAes256Gcm } from "./aes256Gcm.js"

const KEY_BYTES = 32

/**
 * The format {@link AtRestCipher.encrypt} writes: AES-256-GCM under the key
 * HKDF derives from the JWT private key for the purpose.
 */
const CURRENT_VERSION = "1"

const VERSION_SEPARATOR = "."

/**
 * Encrypts secrets kept at rest under keys derived from the JWT private key,
 * one per `purpose`. Replacing the JWT private key leaves them unreadable.
 */
@Injectable()
export class AtRestCipher {
  private readonly keys = new Map<string, Buffer>()

  constructor(private readonly secretsService: SecretsService) {}

  private async getKey(purpose: string) {
    const cachedKey = this.keys.get(purpose)

    if (cachedKey) return cachedKey

    const jwtPrivateKey = await this.secretsService.getJwtPrivateKey()
    const key = Buffer.from(
      hkdfSync("sha256", jwtPrivateKey, "", purpose, KEY_BYTES),
    )

    this.keys.set(purpose, key)

    return key
  }

  /**
   * Writes `<version>.<payload>`. It decrypts only with the same
   * `associatedData`, such as the id of the row that stores it, so it cannot
   * be copied into another row.
   */
  async encrypt({
    purpose,
    plaintext,
    associatedData,
  }: {
    purpose: string
    plaintext: string
    associatedData: string
  }) {
    const payload = encryptAes256Gcm(
      plaintext,
      await this.getKey(purpose),
      associatedData,
    )

    return `${CURRENT_VERSION}${VERSION_SEPARATOR}${payload}`
  }

  /** `null` for an altered payload, another key or associated data, or an unknown version. */
  async decrypt({
    purpose,
    ciphertext,
    associatedData,
  }: {
    purpose: string
    ciphertext: string
    associatedData: string
  }) {
    const segments = ciphertext.split(VERSION_SEPARATOR)
    const [version, payload] = segments
    const isCurrentVersion =
      segments.length === 2 &&
      version === CURRENT_VERSION &&
      payload !== undefined

    if (!isCurrentVersion) return null

    return decryptAes256Gcm(payload, await this.getKey(purpose), associatedData)
  }

  /** For values written before versions and associated data: KOReader sync keys. */
  async encryptUnversioned({
    purpose,
    plaintext,
  }: {
    purpose: string
    plaintext: string
  }) {
    return encryptAes256Gcm(plaintext, await this.getKey(purpose))
  }

  /** `null` for an altered payload or one encrypted under another key. */
  async decryptUnversioned({
    purpose,
    ciphertext,
  }: {
    purpose: string
    ciphertext: string
  }) {
    return decryptAes256Gcm(ciphertext, await this.getKey(purpose))
  }
}
