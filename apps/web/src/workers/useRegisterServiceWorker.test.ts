import { renderHook } from "@testing-library/react"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { useRegisterServiceWorker } from "./useRegisterServiceWorker"

const { reloadPage } = vi.hoisted(function createReloadPageSpy() {
  return { reloadPage: vi.fn() }
})

vi.mock("../common/browser/reloadPage", function mockReloadPage() {
  return { reloadPage }
})

vi.mock(
  "./serviceWorkerRegistration",
  function mockServiceWorkerRegistration() {
    return { register: vi.fn() }
  },
)

const activatedState: ServiceWorkerState = "activated"

const createServiceWorker = (scriptURL: string): ServiceWorker =>
  Object.assign(new EventTarget(), {
    scriptURL,
    state: activatedState,
    onstatechange: null,
    onerror: null,
    postMessage: vi.fn(),
  })

const renderWithController = (initialController: ServiceWorker | null) => {
  const controllerGetter = vi
    .spyOn(navigator.serviceWorker, "controller", "get")
    .mockReturnValue(initialController)
  const { unmount } = renderHook(useRegisterServiceWorker)

  onTestFinished(function restoreUncontrolledPage() {
    unmount()
    controllerGetter.mockRestore()
    reloadPage.mockClear()
  })

  return function takeControl(controller: ServiceWorker) {
    controllerGetter.mockReturnValue(controller)
    navigator.serviceWorker.dispatchEvent(new Event("controllerchange"))
  }
}

describe("useRegisterServiceWorker", () => {
  it("does not reload when the first service worker claims the page", () => {
    const takeControl = renderWithController(null)

    takeControl(createServiceWorker("/service-worker.js?v1"))

    expect(reloadPage).not.toHaveBeenCalled()
  })

  it("reloads when an update replaces the service worker that controls the page", () => {
    const takeControl = renderWithController(
      createServiceWorker("/service-worker.js?v1"),
    )

    takeControl(createServiceWorker("/service-worker.js?v2"))

    expect(reloadPage).toHaveBeenCalledOnce()
  })

  it("reloads when an update replaces the first service worker of the session", () => {
    const takeControl = renderWithController(null)
    takeControl(createServiceWorker("/service-worker.js?v1"))

    takeControl(createServiceWorker("/service-worker.js?v2"))

    expect(reloadPage).toHaveBeenCalledOnce()
  })
})
