import { inspect } from "node:util"
import { KOREADER_SYNC_AUTHORIZE_ROUTE, toSyncKey } from "../protocol.js"
import { isNonPublicAddressError } from "../../lib/http/publicAddress.js"
import { requestKoreaderSyncServer } from "./koreader-sync-client.js"

describe("requestKoreaderSyncServer", () => {
  it("keeps the key out of the error of a refused request", async () => {
    const key = toSyncKey("secret")

    const error = await requestKoreaderSyncServer({
      serverUrl: "https://127.0.0.1:7200",
      route: KOREADER_SYNC_AUTHORIZE_ROUTE,
      method: "GET",
      username: "kobo",
      key,
    }).then(
      () => undefined,
      (refusal: unknown) => refusal,
    )

    expect(isNonPublicAddressError(error)).toBe(true)
    expect(inspect(error, { depth: Number.POSITIVE_INFINITY })).not.toContain(
      key,
    )
  })
})
