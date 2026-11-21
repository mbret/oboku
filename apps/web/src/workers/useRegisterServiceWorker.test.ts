import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { register } from "./serviceWorkerRegistration"
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

  const [registrationCallbacks] = vi.mocked(register).mock.lastCall ?? []

  onTestFinished(function restoreUncontrolledPage() {
    unmount()
    controllerGetter.mockRestore()
    reloadPage.mockClear()
    vi.mocked(register).mockClear()
  })

  return {
    takeControl(controller: ServiceWorker) {
      controllerGetter.mockReturnValue(controller)
      navigator.serviceWorker.dispatchEvent(new Event("controllerchange"))
    },
    offerUpdate(waiting: ServiceWorker) {
      // The hook reads only `waiting`. A complete ServiceWorkerRegistration
      // would also need fake push, cookie and navigation preload managers.
      const registration = { waiting } as ServiceWorkerRegistration

      act(function findWaitingServiceWorker() {
        registrationCallbacks?.onWaitingServiceWorkerFound?.(registration)
      })
    },
  }
}

describe("useRegisterServiceWorker", () => {
  it("does not reload when the first service worker claims the page", () => {
    const { takeControl } = renderWithController(null)

    takeControl(createServiceWorker("/service-worker.js?v1"))

    expect(reloadPage).not.toHaveBeenCalled()
  })

  it("reloads when an update replaces the service worker that controls the page", () => {
    const { takeControl } = renderWithController(
      createServiceWorker("/service-worker.js?v1"),
    )

    takeControl(createServiceWorker("/service-worker.js?v2"))

    expect(reloadPage).toHaveBeenCalledOnce()
  })

  it("reloads when an update replaces the first service worker of the session", () => {
    const { takeControl } = renderWithController(null)
    takeControl(createServiceWorker("/service-worker.js?v1"))

    takeControl(createServiceWorker("/service-worker.js?v2"))

    expect(reloadPage).toHaveBeenCalledOnce()
  })

  it("reloads when the update the page offered takes control of an uncontrolled page", () => {
    const { offerUpdate, takeControl } = renderWithController(null)
    const update = createServiceWorker("/service-worker.js?v2")
    offerUpdate(update)

    takeControl(update)

    expect(reloadPage).toHaveBeenCalledOnce()
  })
})
