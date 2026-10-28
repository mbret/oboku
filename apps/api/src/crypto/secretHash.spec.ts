import { hashSecret, isSecretMatchingHash } from "./secretHash.js"

describe("hashSecret", () => {
  it("produces the hex SHA-256 that stored hashes hold", () => {
    expect(hashSecret("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    )
  })
})

describe("isSecretMatchingHash", () => {
  it("matches a secret only against the hash of that secret", () => {
    const secretHash = hashSecret("k7mq-x2fp-9dwa-hc4n")

    expect(isSecretMatchingHash("k7mq-x2fp-9dwa-hc4n", secretHash)).toBe(true)
    expect(isSecretMatchingHash("k7mq-x2fp-9dwa-hc4m", secretHash)).toBe(false)
  })
})
