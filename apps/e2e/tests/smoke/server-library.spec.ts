import { expect, test } from "../../src/fixtures"
import { SERVER_LIBRARY_BOOKS } from "../../src/library"
import {
  addServerLibrary,
  LIBRARY_SYNC_TIMEOUT_MS,
  signUp,
} from "../../src/steps"

test("a reader syncs the server library and sees each book's title and author", async ({
  page,
  signUpInvitation,
}) => {
  test.slow()
  await signUp(page, signUpInvitation)
  await addServerLibrary(page)

  await page.getByRole("link", { name: "Library", exact: true }).click()

  for (const book of SERVER_LIBRARY_BOOKS) {
    await expect(page.getByText(book.title, { exact: true })).toBeVisible({
      timeout: LIBRARY_SYNC_TIMEOUT_MS,
    })
    await expect(page.getByText(book.author, { exact: true })).toBeVisible()
  }
})
