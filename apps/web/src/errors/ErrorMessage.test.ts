import { describe, expect, it } from "vitest"
import { ObokuErrorCode } from "@oboku/shared"
import { HttpClientError } from "../http/httpClient.shared"
import { errorToMessage } from "./ErrorMessage"

const createApiError = (status: number, data: unknown) =>
  new HttpClientError(
    {
      response: new Response(),
      data,
      status,
      statusText: "",
      headers: {},
      config: { input: "https://api.example.com/koreader-sync-connection" },
    },
    undefined,
  )

describe("errorToMessage", () => {
  it("shows the message of the code an API error carries", () => {
    const error = createApiError(400, {
      errors: [
        { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED },
      ],
    })

    expect(errorToMessage(error)).toBe(
      "The sync server did not accept this username and password.",
    )
  })

  it("keeps the sign-in messages of their codes", () => {
    const error = createApiError(400, {
      errors: [{ code: ObokuErrorCode.ERROR_SIGNIN_NO_EMAIL }],
    })

    expect(errorToMessage(error)).toBe(
      "Please make your email address accessible with this provider",
    )
  })

  it("ignores a code oboku does not define", () => {
    const error = createApiError(400, { errors: [{ code: "not-a-code" }] })

    expect(errorToMessage(error)).toBe(error.message)
  })
})
