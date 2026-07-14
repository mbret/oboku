// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { Component, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LoadConfiguration } from "./LoadConfiguration"
import { seedWebConfigFromCache, useConfig } from "./useConfig"

vi.mock("./useConfig", () => ({
  useConfig: vi.fn(),
  seedWebConfigFromCache: vi.fn(),
}))

vi.mock("../common/SplashScreen", () => ({
  SplashScreen: ({ show }: { show: boolean }) =>
    show ? <div data-testid="splash" /> : null,
}))

class CaughtErrorProbe extends Component<
  { children: ReactNode },
  { errorName: string | null }
> {
  state = { errorName: null }

  static getDerivedStateFromError(error: Error) {
    return { errorName: error.name }
  }

  render() {
    return this.state.errorName ? (
      <div data-testid="boundary">{this.state.errorName}</div>
    ) : (
      this.props.children
    )
  }
}

// test stub: LoadConfiguration only reads data/isError/error off the result
const stubConfigQuery = (result: {
  data?: unknown
  isError?: boolean
  error?: unknown
}) =>
  vi
    .mocked(useConfig)
    .mockReturnValue(result as unknown as ReturnType<typeof useConfig>)

const renderBoot = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CaughtErrorProbe>
        <LoadConfiguration>
          <div data-testid="app" />
        </LoadConfiguration>
      </CaughtErrorProbe>
    </QueryClientProvider>,
  )

describe("LoadConfiguration", () => {
  beforeEach(() => {
    vi.mocked(seedWebConfigFromCache).mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders the app once config is available", async () => {
    stubConfigQuery({ data: { API_URL: "https://example.test" } })

    renderBoot()

    expect(await screen.findByTestId("app")).toBeTruthy()
  })

  it("keeps rendering the app when the endpoint fails but a valid config is present", async () => {
    stubConfigQuery({
      data: { API_URL: "https://example.test" },
      isError: true,
      error: new Error("config endpoint down"),
    })

    renderBoot()

    await waitFor(() => {
      expect(vi.mocked(seedWebConfigFromCache)).toHaveBeenCalled()
    })

    expect(screen.getByTestId("app")).toBeTruthy()
    expect(screen.queryByTestId("boundary")).toBeNull()
  })

  it("escalates a CriticalError when no config survives and the endpoint failed", async () => {
    stubConfigQuery({
      data: undefined,
      isError: true,
      error: new Error("config endpoint down"),
    })

    renderBoot()

    const boundary = await screen.findByTestId("boundary")

    expect(boundary.textContent).toBe("CriticalError")
  })

  it("shows the splash while the cache seed is still in flight rather than escalating", async () => {
    vi.mocked(seedWebConfigFromCache).mockReturnValue(new Promise(() => {}))
    stubConfigQuery({
      data: undefined,
      isError: true,
      error: new Error("config endpoint down"),
    })

    renderBoot()

    expect(await screen.findByTestId("splash")).toBeTruthy()
    expect(screen.queryByTestId("boundary")).toBeNull()
    expect(screen.queryByTestId("app")).toBeNull()
  })
})
