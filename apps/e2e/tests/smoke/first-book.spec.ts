import { expect, test } from "../../src/fixtures"
import { THE_TIME_MACHINE } from "../../src/library"
import { signUp } from "../../src/steps"

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

  await page.getByText(THE_TIME_MACHINE.fileName).click()
  await page.getByRole("button", { name: "Go to details" }).click()
  await page.getByRole("button", { name: "Read", exact: true }).click()

  await expect(
    page
      .locator("iframe")
      .first()
      .contentFrame()
      .getByRole("img", { name: THE_TIME_MACHINE.titlePageImageName }),
  ).toBeVisible()
})
