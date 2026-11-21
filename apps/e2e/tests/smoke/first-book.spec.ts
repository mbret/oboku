import { expect, test } from "../../src/fixtures"
import { THE_TIME_MACHINE } from "../../src/library"

test("a new reader signs up, adds an EPUB from the device and reads it", async ({
  page,
  newAccount,
}) => {
  await page.goto(newAccount.signUpLink)
  await page.getByLabel("Password", { exact: true }).fill(newAccount.password)
  await page.getByLabel("Confirm password").fill(newAccount.password)
  await page.getByRole("button", { name: "Complete sign up" }).click()

  await page.getByRole("link", { name: "Library" }).click()
  await page.getByRole("button", { name: "Add a new book" }).click()
  await page.getByRole("button", { name: "From Local file" }).click()
  await page.locator("input[type=file]").setInputFiles(THE_TIME_MACHINE.path)
  await page.getByRole("button", { name: "Confirm" }).click()

  await page.getByText(THE_TIME_MACHINE.fileName).click()
  await page.getByRole("button", { name: "Go to details" }).click()
  await page.getByRole("button", { name: "Read" }).click()

  await expect(
    page
      .frameLocator("iframe")
      .first()
      .getByRole("img", { name: THE_TIME_MACHINE.titlePageImageName }),
  ).toBeVisible()
})
