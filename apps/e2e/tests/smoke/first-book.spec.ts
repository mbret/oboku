import { expect, test } from "../../src/fixtures"
import { THE_TIME_MACHINE } from "../../src/library"
import { firstReaderPage } from "../../src/reader"
import { openBookDetails, readFromDetailsScreen, signUp } from "../../src/steps"

test("a new reader signs up, adds an EPUB from the device and reads it", async ({
  page,
  signUpInvitation,
}) => {
  await signUp(page, signUpInvitation)

  await page.getByRole("link", { name: "Library", exact: true }).click()
  await page.getByRole("button", { name: "Add a new book" }).click()
  await page.getByRole("button", { name: "From Local file" }).click()
  await page
    .getByRole("dialog")
    .locator("input[type=file]")
    .setInputFiles(THE_TIME_MACHINE.path)
  await page.getByRole("button", { name: "Confirm" }).click()

  await openBookDetails(page, THE_TIME_MACHINE.fileName)
  await readFromDetailsScreen(page)

  await expect(
    firstReaderPage(page)
      .contentFrame()
      .getByRole("img", { name: THE_TIME_MACHINE.titlePage.imageName }),
  ).toBeVisible()
})
