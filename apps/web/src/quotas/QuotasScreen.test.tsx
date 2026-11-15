import type { UserProxiedDownloadQuotaResponseDto } from "@oboku/shared"
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, type Mock, vi } from "vitest"
import { HttpClientApiContext } from "../http"
import type { HttpApiClientWeb } from "../http/HttpClientApi.web"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../profiles/active/activeProfileId"
import { QuotasScreen } from "./QuotasScreen"

vi.mock("../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

const PROXIED_DOWNLOAD_QUOTA: UserProxiedDownloadQuotaResponseDto = {
  usedBytes: 12_300_000_000,
  quotaBytes: 500_000_000_000,
  userUsedBytes: 2_100_000_000,
  userQuotaBytes: 25_000_000_000,
  resetsAt: "2026-12-01T00:00:00.000Z",
}

const renderScreen = (fetchQuota: Mock) => {
  // test double: the screen only calls the generated client's GET
  const client = {
    sdkClient: { get: fetchQuota },
  } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  })

  setActiveProfileId("profile")
  render(
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        <MemoryRouter>
          <QuotasScreen />
        </MemoryRouter>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )
}

describe("QuotasScreen", () => {
  afterEach(() => {
    cleanup()
    clearActiveProfileId()
    onlineManager.setOnline(true)
  })

  it("shows the user's download quota and the one of all users, and when both start over", async () => {
    renderScreen(vi.fn().mockResolvedValue({ data: PROXIED_DOWNLOAD_QUOTA }))

    expect(
      await screen.findByText("2.1 GB used of 25.0 GB (8.40%)"),
    ).toBeTruthy()
    expect(screen.getByText("12.3 GB used of 500.0 GB (2.46%)")).toBeTruthy()
    expect(
      screen
        .getAllByRole("progressbar")
        .map((bar) => bar.getAttribute("aria-valuenow")),
    ).toEqual(["8.4", "2.46"])
    expect(
      screen.getByText("Both quotas start over on December 1, 2026."),
    ).toBeTruthy()
  })

  it("fills the bar of a quota the downloads passed", async () => {
    renderScreen(
      vi.fn().mockResolvedValue({
        data: { ...PROXIED_DOWNLOAD_QUOTA, userUsedBytes: 25_500_000_000 },
      }),
    )

    expect(
      await screen.findByText("25.5 GB used of 25.0 GB (102.00%)"),
    ).toBeTruthy()
    expect(
      screen.getAllByRole("progressbar")[0]?.getAttribute("aria-valuenow"),
    ).toBe("100")
  })

  it("says the OPDS servers' downloads count towards it, linking to them", async () => {
    renderScreen(vi.fn().mockResolvedValue({ data: PROXIED_DOWNLOAD_QUOTA }))

    const opdsServersLink = await screen.findByRole<HTMLAnchorElement>("link", {
      name: "OPDS servers",
    })

    expect(opdsServersLink.getAttribute("href")).toBe(
      "/integrations/opds/servers",
    )
  })

  it("says when the download quota cannot load", async () => {
    renderScreen(vi.fn().mockRejectedValue(new Error("Network down")))

    expect(
      await screen.findByText(
        "Something went wrong while loading the download quotas. Please try again later.",
      ),
    ).toBeTruthy()
  })

  it("says when the download quota cannot load while the browser is offline", async () => {
    onlineManager.setOnline(false)
    renderScreen(vi.fn().mockResolvedValue({ data: PROXIED_DOWNLOAD_QUOTA }))

    expect(
      await screen.findByText("The download quotas can't be loaded right now."),
    ).toBeTruthy()
  })
})
