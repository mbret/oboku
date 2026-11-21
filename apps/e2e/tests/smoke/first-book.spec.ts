import { expect, test } from "../../src/fixtures"
import { THE_TIME_MACHINE } from "../../src/library"

test("a new reader signs up, adds an EPUB from the device and reads it", async ({
  page,
  signUpInvitation,
}) => {
  await page.goto(signUpInvitation.signUpLink)
  await page
    .getByLabel("Password", { exact: true })
    .fill(signUpInvitation.password)
  await page.getByLabel("Confirm password").fill(signUpInvitation.password)
  await page.getByRole("button", { name: "Complete sign up" }).click()

  await page.getByRole("link", { name: "Library" }).click()
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
