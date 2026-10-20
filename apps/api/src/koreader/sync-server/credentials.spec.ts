import { toSyncKey } from "../protocol.js"
import {
  generateSyncPassword,
  hashSyncKey,
  isSyncKeyMatchingHash,
} from "./credentials.js"

describe("KOReader sync credentials", () => {
  it("generates passwords that are easy to type on an e-reader", () => {
    const password = generateSyncPassword()

    expect(password).toMatch(
      /^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/,
    )
  })

  it("never generates the same password twice in a row", () => {
    expect(generateSyncPassword()).not.toBe(generateSyncPassword())
  })

  it("matches a key only against the hash of that key", () => {
    const keyHash = hashSyncKey(toSyncKey("k7mq-x2fp-9dwa-hc4n"))

    expect(
      isSyncKeyMatchingHash(toSyncKey("k7mq-x2fp-9dwa-hc4n"), keyHash),
    ).toBe(true)
    expect(
      isSyncKeyMatchingHash(toSyncKey("k7mq-x2fp-9dwa-hc4m"), keyHash),
    ).toBe(false)
  })
})
