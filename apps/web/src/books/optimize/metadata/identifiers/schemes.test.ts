import { describe, expect, it } from "vitest"
import { validateIdentifierValue } from "./schemes"

describe("validateIdentifierValue", function testValidateIdentifierValue() {
  it("accepts a UUID, bare or as a URN in any case", function acceptUuid() {
    expect(
      validateIdentifierValue("UUID", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"),
    ).toBe(true)
    expect(
      validateIdentifierValue(
        "UUID",
        "urn:uuid:F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6",
      ),
    ).toBe(true)
  })

  it("refuses an ISBN as a UUID", function refuseIsbnAsUuid() {
    expect(validateIdentifierValue("UUID", "9783161484100")).toBe("Not a UUID")
  })

  it("accepts a URN and refuses one without its prefix", function checkUrn() {
    expect(validateIdentifierValue("URN", "urn:nbn:de:101:1-2011020336")).toBe(
      true,
    )
    expect(validateIdentifierValue("URN", "isbn:9783161484100")).toBe(
      "Not a URN, e.g. urn:isbn:9783161484100",
    )
  })
})
