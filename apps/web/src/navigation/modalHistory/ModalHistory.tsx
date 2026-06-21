import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react"
import { useLocation, useNavigate } from "react-router"

/**
 * One overlay's stake in the browser history. The provider owns the lifecycle;
 * the fields are mutated in place so a single object identity can be tracked
 * across renders without re-registering.
 */
export type ModalController = {
  /** The reserved `__oboku_modal` hash while an entry is live, else undefined. */
  hash: string | undefined
  /** True once the location has actually reached this controller's entry. */
  synced: boolean
  /** Called when the entry is popped by navigation (back button or `close`). */
  onExit: () => void
  /** Ran right after `onExit` for a single dismissal, then cleared. */
  afterClose: (() => void) | undefined
}

type ModalHistoryContextValue = {
  /** Track a controller for this provider's lifetime. Returns an unregister fn. */
  register: (controller: ModalController) => () => void
  /** Push a dedicated history entry and assign the controller its hash. */
  reserve: (controller: ModalController) => void
  /** Dismiss the controller's entry (pops history), optionally running a cb. */
  close: (controller: ModalController, afterClose?: () => void) => void
}

const ModalHistoryContext = createContext<ModalHistoryContextValue | undefined>(
  undefined,
)

/**
 * Single owner of modal browser-history entries.
 *
 * A modal entry shares the exact same URL as the entry beneath it — only its
 * history `state.__oboku_modal` hash differs — so reserving and popping one is
 * visually invisible and just lets the back button dismiss the overlay.
 *
 * This provider centralises everything that concerns those entries:
 * - the registry of mounted overlay controllers (replaces the old module global),
 * - the single `useLocation` subscription that drives dismissal events,
 * - all navigation (push on reserve, pop on close),
 * - discarding "ghost" entries (a hash no mounted controller backs — e.g. one
 *   that survived a page reload, or whose overlay unmounted without dismissing).
 *
 * Mount once inside the router, above any overlay consumer.
 */
export const ModalHistoryProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const state = useLocation().state as { __oboku_modal?: string } | null
  const modalHash = state?.__oboku_modal

  const controllersRef = useRef<Set<ModalController>>(new Set())
  // Each ghost is popped exactly once. `navigate(-1)` is async, so without this
  // guard React StrictMode (double-invoked mount effects) would fire two
  // `go(-1)` calls for one hash and skip the page beneath the modal too.
  const poppedGhostRef = useRef<string | undefined>(undefined)

  const value = useMemo<ModalHistoryContextValue>(
    () => ({
      register: (controller) => {
        controllersRef.current.add(controller)

        return () => {
          controllersRef.current.delete(controller)
        }
      },
      reserve: (controller) => {
        const hash = `#modal-${crypto.randomUUID()}`

        controller.hash = hash
        controller.synced = false

        navigate(
          {
            hash: window.location.hash,
            search: window.location.search,
            pathname: window.location.pathname,
          },
          { state: { __oboku_modal: hash } },
        )
      },
      close: (controller, afterClose) => {
        controller.afterClose = afterClose
        // Navigate first so any heavy work in the callback never delays the
        // overlay's closing animation.
        navigate(-1)
      },
    }),
    [navigate],
  )

  useEffect(
    function reconcileControllersWithLocation() {
      let someControllerOwnsCurrent = false

      for (const controller of controllersRef.current) {
        if (!controller.hash) continue

        if (controller.hash === modalHash) {
          someControllerOwnsCurrent = true
          controller.synced = true
        } else if (controller.synced) {
          // Our entry was the current one and no longer is: it was popped by
          // navigation. Reset before notifying so the controller reads as
          // closed (idempotent under StrictMode's double invoke).
          const afterClose = controller.afterClose
          controller.hash = undefined
          controller.synced = false
          controller.afterClose = undefined
          controller.onExit()
          afterClose?.()
        }
      }

      if (
        modalHash &&
        !someControllerOwnsCurrent &&
        poppedGhostRef.current !== modalHash
      ) {
        poppedGhostRef.current = modalHash
        navigate(-1)
      }
    },
    [modalHash, navigate],
  )

  return (
    <ModalHistoryContext.Provider value={value}>
      {children}
    </ModalHistoryContext.Provider>
  )
}

export const useModalHistory = () => {
  const context = useContext(ModalHistoryContext)

  if (!context) {
    throw new Error(
      "useModalHistory must be used within a ModalHistoryProvider",
    )
  }

  return context
}
