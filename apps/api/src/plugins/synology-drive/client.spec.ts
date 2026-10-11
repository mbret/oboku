import { inspect } from "node:util"
import { isNonPublicAddressError } from "../../lib/http/publicAddress.js"
import { signInSynologyDrive } from "./client.js"

describe("signInSynologyDrive", () => {
  it("keeps the password out of the error of a refused sign-in", async () => {
    const password = "dsm-password-1234"

    const error = await signInSynologyDrive({
      baseUrl: "https://127.0.0.1:5001",
      username: "alice",
      password,
    }).then(
      () => undefined,
      (refusal: unknown) => refusal,
    )

    expect(isNonPublicAddressError(error)).toBe(true)
    expect(inspect(error, { depth: Number.POSITIVE_INFINITY })).not.toContain(
      password,
    )
  })
})
