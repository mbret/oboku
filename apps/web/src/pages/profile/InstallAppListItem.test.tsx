import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  offerInstallPrompt,
  reportAppInstalled,
} from "../../common/browser/installPrompt.fixture"
import { activateLocale } from "../../i18n/activateLocale"
import { InstallAppListItem } from "./InstallAppListItem"

const renderInstallAppListItem = async () => {
  await activateLocale("en")

  render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <InstallAppListItem />
      </QueryClientProvider>
    </I18nProvider>,
  )
}

const findInstallAction = () =>
  screen.findByRole("button", { name: /Install the app/ })

describe("InstallAppListItem", () => {
  afterEach(function leaveNoOfferForTheNextTest() {
    cleanup()
    reportAppInstalled()
  })

  it("shows nothing while the browser offers no install", async () => {
    await renderInstallAppListItem()

    expect(screen.queryByRole("button")).toBeNull()
  })

  it("opens the browser's install dialog and waits for its answer", async () => {
    await renderInstallAppListItem()
    const { installPrompt } = offerInstallPrompt()
    const openInstallDialog = vi.spyOn(installPrompt, "prompt")
    const installAction = await findInstallAction()

    fireEvent.click(installAction)

    await expect
      .poll(() => installAction.getAttribute("aria-disabled"))
      .toBe("true")
    expect(openInstallDialog).toHaveBeenCalledOnce()
  })

  it("hides the action once the user answered the install dialog", async () => {
    await renderInstallAppListItem()
    const { answerInstallDialog } = offerInstallPrompt()
    fireEvent.click(await findInstallAction())

    answerInstallDialog({ outcome: "accepted", platform: "web" })

    await expect.poll(() => screen.queryByRole("button")).toBeNull()
  })

  it("shows the action again when the browser offers the install after a dismissal", async () => {
    await renderInstallAppListItem()
    const { answerInstallDialog } = offerInstallPrompt()
    fireEvent.click(await findInstallAction())
    answerInstallDialog({ outcome: "dismissed", platform: "" })
    await expect.poll(() => screen.queryByRole("button")).toBeNull()

    offerInstallPrompt()

    const installAction = await findInstallAction()
    expect(installAction.getAttribute("aria-disabled")).not.toBe("true")
  })
})
