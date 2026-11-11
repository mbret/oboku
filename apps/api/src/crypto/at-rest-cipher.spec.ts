import { hkdfSync } from "node:crypto"
import { Test } from "@nestjs/testing"
import { SecretsService } from "../config/SecretsService.js"
import { encryptAes256Gcm } from "./aes256Gcm.js"
import { AtRestCipher } from "./at-rest-cipher.js"

const JWT_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----"
const PURPOSE = "oboku/test/credentials"

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
  it("reads a KOReader sync key encrypted before the cipher was shared", async () => {
    const koreaderPurpose = "oboku/koreader-sync-connection/key"
    const koreaderKey = Buffer.from(
      hkdfSync("sha256", JWT_PRIVATE_KEY, "", koreaderPurpose, 32),
    )
    const storedKey = encryptAes256Gcm("sync-key", koreaderKey)
    const cipher = await createCipher()

    await expect(
      cipher.decryptUnversioned({
        purpose: koreaderPurpose,
        ciphertext: storedKey,
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

  it("refuses a ciphertext of another purpose", async () => {
    const cipher = await createCipher()
    const ciphertext = await cipher.encrypt({
      purpose: PURPOSE,
      plaintext: "refresh-token",
      associatedData: "user:1:google",
    })

    await expect(
      cipher.decrypt({
        purpose: "oboku/test/other",
        ciphertext,
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
          purpose: PURPOSE,
          plaintext: "refresh-token",
        }),
        associatedData: "user:1:google",
      }),
    ).resolves.toBeNull()
  })
})
