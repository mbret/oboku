import { hashSecret, isSecretMatchingHash } from "./secretHash.js"

describe("isSecretMatchingHash", () => {
  it("matches a secret only against the hash of that secret", () => {
    const secretHash = hashSecret("k7mq-x2fp-9dwa-hc4n")

    expect(isSecretMatchingHash("k7mq-x2fp-9dwa-hc4n", secretHash)).toBe(true)
    expect(isSecretMatchingHash("k7mq-x2fp-9dwa-hc4m", secretHash)).toBe(false)
  })
})
