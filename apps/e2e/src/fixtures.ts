import { randomUUID } from "node:crypto"
import { type BrowserContext, test as base } from "@playwright/test"
import {
  adminGenerateSignUpLink,
  adminSignIn,
  createApiClient,
} from "@oboku/shared"
import { ADMIN_CREDENTIALS, API_URL, isStackUrl } from "./stack"

type SignUpInvitation = {
  password: string
  signUpLink: string
}

export const test = base.extend<{ signUpInvitation: SignUpInvitation }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright reads the fixtures a fixture depends on from this destructuring.
  signUpInvitation: async function inviteNewReader({}, use) {
    const {
      data: { access_token },
    } = await adminSignIn({
      client: createApiClient({ baseUrl: API_URL, throwOnError: true }),
      body: ADMIN_CREDENTIALS,
    })
    const {
      data: { signUpLink },
    } = await adminGenerateSignUpLink({
      client: createApiClient({
        baseUrl: API_URL,
        throwOnError: true,
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      body: { email: `reader-${randomUUID()}@oboku.test` },
    })

    await use({ password: "e2e-password", signUpLink })
  },
  context: async function prepareContext({ context }, use) {
    await context.route(
      function isOutsideTheStack(url) {
        return !isStackUrl(url)
      },
      function abortRequestOutsideTheStack(route) {
        return route.abort("blockedbyclient")
      },
    )
    await installServiceWorker(context)

    await use(context)
  },
})

/**
 * The web app reloads when a service worker first takes control of a page
 * (a known bug), so a test's pages open after this installs one.
 */
async function installServiceWorker(context: BrowserContext) {
  const page = await context.newPage()

  await page.goto("/")
  await page.waitForFunction(function isControlledByServiceWorker() {
    return navigator.serviceWorker.controller !== null
  })
  await page.close()
}

export { expect } from "@playwright/test"
