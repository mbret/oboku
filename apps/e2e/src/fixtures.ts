import { randomUUID } from "node:crypto"
import { test as base } from "@playwright/test"
import { adminGenerateSignUpLink } from "@oboku/shared"
import { signInAsAdmin } from "./admin"
import { isStackUrl } from "./stack"

type SignUpInvitation = {
  password: string
  signUpLink: string
}

export const test = base.extend<{ signUpInvitation: SignUpInvitation }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright reads the fixtures a fixture depends on from this destructuring.
  signUpInvitation: async function inviteNewReader({}, use) {
    const {
      data: { signUpLink },
    } = await adminGenerateSignUpLink({
      client: await signInAsAdmin(),
      body: { email: `reader-${randomUUID()}@oboku.test` },
    })

    await use({ password: "e2e-password", signUpLink })
  },
  context: async function blockRequestsOutsideTheStack({ context }, use) {
    await context.route(
      function isOutsideTheStack(url) {
        return !isStackUrl(url)
      },
      function abortRequestOutsideTheStack(route) {
        return route.abort("blockedbyclient")
      },
    )

    await use(context)
  },
})

export { expect } from "@playwright/test"
