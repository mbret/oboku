import { randomBytes } from "node:crypto"
import { decryptAes256Gcm, encryptAes256Gcm } from "./aes256Gcm.js"

describe("aes256Gcm", () => {
  const key = randomBytes(32)

  it("decrypts what it encrypted", () => {
    const payload = encryptAes256Gcm("0123456789abcdef0123456789abcdef", key)

    expect(decryptAes256Gcm(payload, key)).toBe(
      "0123456789abcdef0123456789abcdef",
    )
  })

  it("encrypts the same plaintext differently each time", () => {
    expect(encryptAes256Gcm("secret", key)).not.toBe(
      encryptAes256Gcm("secret", key),
    )
  })

  it("returns null under another key", () => {
    const payload = encryptAes256Gcm("secret", key)

    expect(decryptAes256Gcm(payload, randomBytes(32))).toBeNull()
  })

  it("returns null for an altered payload", () => {
    const packed = Buffer.from(encryptAes256Gcm("secret", key), "base64")
    const lastByteIndex = packed.length - 1
    packed.writeUInt8(packed.readUInt8(lastByteIndex) ^ 1, lastByteIndex)

    expect(decryptAes256Gcm(packed.toString("base64"), key)).toBeNull()
  })
})
