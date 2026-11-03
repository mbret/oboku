import { expect, it } from "vitest"
import { requestMicrosoftAccessToken } from "./auth"

it("rejects token requests until OneDrive is configured", async () => {
  await expect(
    requestMicrosoftAccessToken({
      scopes: ["Files.Read"],
    }),
  ).rejects.toThrow(
    "OneDrive is not configured. Register the application client ID in admin first.",
  )
})
