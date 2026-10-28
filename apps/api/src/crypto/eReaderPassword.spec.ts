import { generateEReaderPassword } from "./eReaderPassword.js"

describe("generateEReaderPassword", () => {
  it("generates passwords that are easy to type on an e-reader", () => {
    const password = generateEReaderPassword()

    expect(password).toMatch(
      /^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/,
    )
  })

  it("never generates the same password twice in a row", () => {
    expect(generateEReaderPassword()).not.toBe(generateEReaderPassword())
  })
})
