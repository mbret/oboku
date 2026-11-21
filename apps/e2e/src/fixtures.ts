import { randomUUID } from "node:crypto"
import { type BrowserContext, test as base } from "@playwright/test"
import {
  adminGenerateSignUpLink,
  adminSignIn,
  type ApiClient,
  createApiClient,
} from "@oboku/shared"
import { ADMIN_CREDENTIALS, API_URL, isStackUrl } from "./stack"

type NewAccount = {
  password: string
  signUpLink: string
}

export const test = base.extend<
  { newAccount: NewAccount },
  { adminClient: ApiClient }
>({
  adminClient: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright reads the fixtures a fixture depends on from this destructuring.
    async function signInAsAdmin({}, use) {
      const {
        data: { access_token },
      } = await adminSignIn({
        client: createApiClient({ baseUrl: API_URL, throwOnError: true }),
        body: ADMIN_CREDENTIALS,
      })

      await use(
        createApiClient({
          baseUrl: API_URL,
          throwOnError: true,
          headers: { Authorization: `Bearer ${access_token}` },
        }),
      )
    },
    { scope: "worker" },
  ],
  newAccount: async function createSignUpLink({ adminClient }, use) {
    const email = `reader-${randomUUID()}@oboku.test`
    const {
      data: { signUpLink },
    } = await adminGenerateSignUpLink({ client: adminClient, body: { email } })

    await use({ password: "e2e-password", signUpLink })
  },
  context: async function prepareContext({ context }, use) {
    await context.route(
      (url) => !isStackUrl(url),
      function abortRequestOutsideTheStack(route) {
        return route.abort("blockedbyclient")
      },
    )
    await installServiceWorker(context)

    await use(context)
  },
})

/**
 * The web app reloads when a service worker takes control of the page, and a
 * first visit gets one a few seconds in. Pages opened after this load under
 * the installed worker and never reload.
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
