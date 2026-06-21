import { useCallback, useEffect, useRef } from "react"
import { type ModalController, useModalHistory } from "./ModalHistory"
import { useLiveRef } from "reactjrx"

export type OverlayCloseFn = (afterClose?: () => void) => void

/**
 * Makes an overlay (dialog, drawer, ...) dismissible through browser/mobile
 * back navigation, the safe way.
 *
 * All history mechanics live in {@link ModalHistoryProvider}; this hook only
 * orchestrates the consumer's callback:
 * - `onClose` fires for genuine dismissals (back button, the returned `close`)
 *   but never as a redundant echo when `open` is flipped to false externally —
 *   the live `open` value at dismissal time tells the two apart.
 * - flipping `open` to false from the outside reconciles (pops) the pushed
 *   entry instead of leaving it dangling.
 *
 * Consumers should always dismiss through the returned `close`.
 */
export const useDismissibleOverlay = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}): { close: OverlayCloseFn } => {
  const { register, reserve, close: closeEntry } = useModalHistory()

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const openRef = useLiveRef(open)
  const wasOpenRef = useRef(open)

  // One stable controller object for this overlay's lifetime.
  const controllerRef = useRef<ModalController>(undefined)
  if (!controllerRef.current) {
    controllerRef.current = {
      hash: undefined,
      synced: false,
      afterClose: undefined,
      onExit: () => {
        // A genuine dismissal happens while the overlay still considers itself
        // open, so notify. An external close already flipped `open` to false
        // before the reconciling pop, so there is nothing to echo back.
        if (openRef.current) {
          onCloseRef.current()
        }
      },
    }
  }
  const controller = controllerRef.current

  useEffect(() => register(controller), [register, controller])

  useEffect(
    function keepHistoryInSyncWithOpen() {
      const wasOpen = wasOpenRef.current
      wasOpenRef.current = open

      if (open) {
        if (!controller.hash) reserve(controller)
        return
      }

      // Closed from the outside while the entry is still live: pop the dangling
      // entry. If it was dismissed through navigation, `hash` is already
      // cleared and this is a no-op.
      if (wasOpen && controller.hash) {
        closeEntry(controller)
      }
    },
    [open, reserve, closeEntry, controller],
  )

  const close = useCallback<OverlayCloseFn>(
    (afterClose) => {
      closeEntry(
        controller,
        typeof afterClose === "function" ? afterClose : undefined,
      )
    },
    [closeEntry, controller],
  )

  return { close }
}
