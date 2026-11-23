import { test } from "../../src/fixtures"
import { LITTLE_NEMO } from "../../src/library"
import { expectFirstImagePage } from "../../src/reader"
import {
  addServerLibrary,
  downloadFromDetailsScreen,
  expectServerLibraryBooks,
  openBookDetails,
  readFromDetailsScreen,
  signUp,
} from "../../src/steps"

test("a reader syncs the server library, sees each book's title and author, and reads the comic", async ({
  page,
  signUpInvitation,
}) => {
  test.slow()
  await signUp(page, signUpInvitation)
  await addServerLibrary(page)

  await page.getByRole("link", { name: "Library", exact: true }).click()
  await expectServerLibraryBooks(page)

  await openBookDetails(page, LITTLE_NEMO.title)
  await downloadFromDetailsScreen(page)
  await readFromDetailsScreen(page)

  await expectFirstImagePage(page)
})
