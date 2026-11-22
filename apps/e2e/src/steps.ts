import type { Page } from "@playwright/test"
import { expect, type SignUpInvitation } from "./fixtures"
import { SERVER_LIBRARY_BOOKS } from "./library"
import { SERVER_LIBRARY } from "./stack"

const MASTER_PASSWORD = "e2e-master-password"
const SERVER_PASSWORD_SECRET_NAME = "Server library password"
const SERVER_DATA_SOURCE_NAME = "Server books"

/**
 * Each book's metadata refresh retries the unreachable catalogs for about 4
 * seconds, and the API runs 3 refreshes at a time for all users together.
 */
const LIBRARY_SYNC_TIMEOUT_MS = 60_000

export async function signUp(page: Page, invitation: SignUpInvitation) {
  await page.goto(invitation.signUpLink)
  await page.getByLabel("Password", { exact: true }).fill(invitation.password)
  await page.getByLabel("Confirm password").fill(invitation.password)
  await page.getByRole("button", { name: "Complete sign up" }).click()
  await expect(page.getByRole("link", { name: "Library" })).toBeVisible()
}

/**
 * Unticks "Remember for 5 minutes", so every protected action asks for the
 * master password, whatever ran before it.
 */
async function authorizeWithMasterPassword(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Authorization required" })

  await dialog.getByLabel("Password").fill(MASTER_PASSWORD)
  await dialog
    .getByRole("checkbox", { name: "Remember for 5 minutes" })
    .uncheck()
  await dialog.getByRole("button", { name: "Authorize" }).click()
}

/**
 * Adds the stack's Server Sync folder as a data source, the way a reader does,
 * and waits for its first sync to finish.
 */
export async function addServerLibrary(page: Page) {
  await page.goto("/profile/security")
  await page
    .getByRole("button", { name: /^Initialize my Master Password/ })
    .click()
  await page.getByRole("dialog").getByLabel("Password").fill(MASTER_PASSWORD)
  await page.getByRole("button", { name: "Initialize" }).click()
  await expect(
    page.getByRole("button", { name: /^Change Master Password/ }),
  ).toBeVisible()

  await page.goto("/profile/secrets")
  await page.getByRole("button", { name: "Add a secret" }).click()
  await authorizeWithMasterPassword(page)
  const secretDialog = page.getByRole("dialog", { name: "Add a new secret" })
  await secretDialog.getByLabel("Name").fill(SERVER_PASSWORD_SECRET_NAME)
  await secretDialog.getByLabel("Value").fill(SERVER_LIBRARY.password)
  await secretDialog.getByRole("button", { name: "Add" }).click()
  await expect(
    page.getByRole("button", { name: SERVER_PASSWORD_SECRET_NAME }),
  ).toBeVisible()

  await page.goto("/integrations/server/connectors/new")
  await page.getByLabel("Username").fill(SERVER_LIBRARY.username)
  await page.getByRole("combobox", { name: "Password secret" }).click()
  await page.getByRole("option", { name: SERVER_PASSWORD_SECRET_NAME }).click()
  await page.getByRole("button", { name: "Confirm" }).click()
  await expect(
    page.getByRole("button", { name: new RegExp(SERVER_LIBRARY.username) }),
  ).toBeVisible()

  await page.goto("/sync/new-datasources/server")
  await page.getByLabel("Name").fill(SERVER_DATA_SOURCE_NAME)
  await page.getByRole("combobox", { name: "Connector" }).click()
  await page
    .getByRole("option", { name: SERVER_LIBRARY.username, exact: true })
    .click()
  await page.getByRole("button", { name: "Confirm" }).click()
  await authorizeWithMasterPassword(page)
  await expect(
    page.getByRole("link", {
      name: new RegExp(`^${SERVER_DATA_SOURCE_NAME} Last synced`),
    }),
  ).toBeVisible({ timeout: LIBRARY_SYNC_TIMEOUT_MS })
}

/**
 * On the library, waits for every server book to show the title and the author
 * that the API read from its file.
 */
export async function expectServerLibraryBooks(page: Page) {
  for (const book of SERVER_LIBRARY_BOOKS) {
    await expect(page.getByText(book.title, { exact: true })).toBeVisible({
      timeout: LIBRARY_SYNC_TIMEOUT_MS,
    })
    await expect(page.getByText(book.author, { exact: true })).toBeVisible()
  }
}

/**
 * From a library that shows the book. A book added from the device shows its
 * file name until the API reads its title.
 */
export async function openBookDetails(page: Page, cardTitle: string) {
  await page.getByText(cardTitle, { exact: true }).click()
  await page.getByRole("button", { name: "Go to details" }).click()
  await page.waitForURL(/\/books\//)
}

/** Downloads a server book from its details screen. */
export async function downloadFromDetailsScreen(page: Page) {
  await page.getByRole("button", { name: "Download" }).click()
  await authorizeWithMasterPassword(page)
  await expect(
    page.getByRole("button", { name: "Read", exact: true }),
  ).toBeVisible()
}

export async function readFromDetailsScreen(page: Page) {
  await page.getByRole("button", { name: "Read", exact: true }).click()
  await page.waitForURL(/\/reader\//)
}
