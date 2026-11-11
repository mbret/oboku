import { Test } from "@nestjs/testing"
import { SecretsService } from "../config/SecretsService.js"
import {
  AtRestCipher,
  KOREADER_SYNC_KEY_PURPOSE,
  PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
} from "./at-rest-cipher.js"

const JWT_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----"
const PURPOSE = PROVIDER_CONNECTION_CREDENTIALS_PURPOSE

/** "sync-key" as the API stored KOReader sync keys under JWT_PRIVATE_KEY: IV, tag, ciphertext, base64. */
const STORED_KOREADER_SYNC_KEY =
  "AAECAwQFBgcICQoLs93iFWEeOu5I0Jo2kZ3JYk4HWvr33Oc7"

const createCipher = async () => {
  const module = await Test.createTestingModule({
    providers: [
      AtRestCipher,
      {
        provide: SecretsService,
        useValue: { getJwtPrivateKey: async () => JWT_PRIVATE_KEY },
      },
    ],
  }).compile()

  return module.get(AtRestCipher)
}

describe("AtRestCipher", () => {
  it("reads KOReader sync keys stored without a version", async () => {
    const cipher = await createCipher()

    await expect(
      cipher.decryptUnversioned({
        purpose: KOREADER_SYNC_KEY_PURPOSE,
        ciphertext: STORED_KOREADER_SYNC_KEY,
      }),
    ).resolves.toBe("sync-key")
  })

  it("decrypts what it encrypted, for the same purpose and associated data", async () => {
    const cipher = await createCipher()
    const ciphertext = await cipher.encrypt({
      purpose: PURPOSE,
      plaintext: "refresh-token",
      associatedData: "user:1:google",
    })

    expect(ciphertext.startsWith("1.")).toBe(true)
    await expect(
      cipher.decrypt({
        purpose: PURPOSE,
        ciphertext,
        associatedData: "user:1:google",
      }),
    ).resolves.toBe("refresh-token")
  })

  it("refuses a ciphertext copied to other associated data", async () => {
    const cipher = await createCipher()
    const ciphertext = await cipher.encrypt({
      purpose: PURPOSE,
      plaintext: "refresh-token",
      associatedData: "user:1:google",
    })

    await expect(
      cipher.decrypt({
        purpose: PURPOSE,
        ciphertext,
        associatedData: "user:2:google",
      }),
    ).resolves.toBeNull()
  })

  it("needs associated data, which GCM would otherwise ignore when empty", async () => {
    const cipher = await createCipher()
    const unversionedCiphertext = await cipher.encryptUnversioned({
      purpose: KOREADER_SYNC_KEY_PURPOSE,
      plaintext: "sync-key",
    })

    await expect(
      cipher.encrypt({
        purpose: PURPOSE,
        plaintext: "refresh-token",
        associatedData: "",
      }),
    ).rejects.toThrow()
    await expect(
      cipher.decrypt({
        purpose: PURPOSE,
        ciphertext: `1.${unversionedCiphertext}`,
        associatedData: "",
      }),
    ).resolves.toBeNull()
  })

  it("refuses a ciphertext with anything after its payload", async () => {
    const cipher = await createCipher()
    const ciphertext = await cipher.encrypt({
      purpose: PURPOSE,
      plaintext: "refresh-token",
      associatedData: "user:1:google",
    })

    await expect(
      cipher.decrypt({
        purpose: PURPOSE,
        ciphertext: `${ciphertext}.anything`,
        associatedData: "user:1:google",
      }),
    ).resolves.toBeNull()
  })

  it("refuses an unknown version and an unversioned ciphertext", async () => {
    const cipher = await createCipher()
    const ciphertext = await cipher.encrypt({
      purpose: PURPOSE,
      plaintext: "refresh-token",
      associatedData: "user:1:google",
    })
    const [, payload = ""] = ciphertext.split(".")

    await expect(
      cipher.decrypt({
        purpose: PURPOSE,
        ciphertext: `2.${payload}`,
        associatedData: "user:1:google",
      }),
    ).resolves.toBeNull()
    await expect(
      cipher.decrypt({
        purpose: PURPOSE,
        ciphertext: await cipher.encryptUnversioned({
          purpose: KOREADER_SYNC_KEY_PURPOSE,
          plaintext: "refresh-token",
        }),
        associatedData: "user:1:google",
      }),
    ).resolves.toBeNull()
  })
})
