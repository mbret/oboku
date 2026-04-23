import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from "react"

const LONG_PRESS_DURATION_MS = 350
const LONG_PRESS_MOVE_TOLERANCE = 10
const IGNORE_CLICK_AFTER_LONG_PRESS_MS = 500

function isSelectionControlTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest("[data-selection-control='true']") !== null
  )
}

export function useSelectableItemInteractions({
  selectionMode = false,
  onSelectionStart,
  onSelectionToggle,
  onItemClick,
}: {
  selectionMode?: boolean
  onSelectionStart?: () => void
  onSelectionToggle?: () => void
  onItemClick?: (event: MouseEvent<HTMLElement>) => void
}) {
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastLongPressAtRef = useRef(0)
  const pointerStartPositionRef = useRef<{ x: number; y: number } | null>(null)
  const selectionEnabled = !!onSelectionStart || !!onSelectionToggle

  const clearLongPressTimeout = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }, [])

  useEffect(
    function clearLongPressOnUnmount() {
      return () => {
        clearLongPressTimeout()
      }
    },
    [clearLongPressTimeout],
  )

  const startSelection = useCallback(() => {
    if (onSelectionStart) {
      onSelectionStart()
      return
    }

    onSelectionToggle?.()
  }, [onSelectionStart, onSelectionToggle])

  const handleItemClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (isSelectionControlTarget(event.target)) {
        return
      }

      if (
        Date.now() - lastLongPressAtRef.current <
        IGNORE_CLICK_AFTER_LONG_PRESS_MS
      ) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (selectionMode) {
        event.preventDefault()
        event.stopPropagation()
        onSelectionToggle?.()
        return
      }

      onItemClick?.(event)
    },
    [onItemClick, onSelectionToggle, selectionMode],
  )

  const handleSelectionControlClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      clearLongPressTimeout()

      if (selectionMode) {
        onSelectionToggle?.()
        return
      }

      startSelection()
    },
    [clearLongPressTimeout, onSelectionToggle, selectionMode, startSelection],
  )

  const handleSelectionControlPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      event.stopPropagation()
    },
    [],
  )

  const handleItemPointerDownCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (isSelectionControlTarget(event.target)) {
        return
      }

      if (!selectionEnabled || selectionMode) {
        return
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return
      }

      pointerStartPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
      clearLongPressTimeout()
      longPressTimeoutRef.current = setTimeout(() => {
        lastLongPressAtRef.current = Date.now()
        startSelection()
      }, LONG_PRESS_DURATION_MS)
    },
    [clearLongPressTimeout, selectionEnabled, selectionMode, startSelection],
  )

  const handleItemPointerMoveCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!pointerStartPositionRef.current) {
        return
      }

      if (
        Math.abs(event.clientX - pointerStartPositionRef.current.x) >
          LONG_PRESS_MOVE_TOLERANCE ||
        Math.abs(event.clientY - pointerStartPositionRef.current.y) >
          LONG_PRESS_MOVE_TOLERANCE
      ) {
        pointerStartPositionRef.current = null
        clearLongPressTimeout()
      }
    },
    [clearLongPressTimeout],
  )

  const cancelLongPress = useCallback(() => {
    pointerStartPositionRef.current = null
    clearLongPressTimeout()
  }, [clearLongPressTimeout])

  const itemProps: {
    onClick?: (event: MouseEvent<HTMLElement>) => void
    onPointerCancelCapture?: (event: PointerEvent<HTMLElement>) => void
    onPointerDownCapture?: (event: PointerEvent<HTMLElement>) => void
    onPointerLeave?: (event: PointerEvent<HTMLElement>) => void
    onPointerMoveCapture?: (event: PointerEvent<HTMLElement>) => void
    onPointerUpCapture?: (event: PointerEvent<HTMLElement>) => void
  } = {}

  if (selectionEnabled || onItemClick) {
    itemProps.onClick = handleItemClick
  }

  if (selectionEnabled) {
    itemProps.onPointerCancelCapture = cancelLongPress
    itemProps.onPointerDownCapture = handleItemPointerDownCapture
    itemProps.onPointerLeave = cancelLongPress
    itemProps.onPointerMoveCapture = handleItemPointerMoveCapture
    itemProps.onPointerUpCapture = cancelLongPress
  }

  const controlProps = selectionEnabled
    ? {
        "data-selection-control": "true" as const,
        onClick: handleSelectionControlClick,
        onPointerDown: handleSelectionControlPointerDown,
      }
    : {}

  return {
    itemProps,
    controlProps,
    selectionEnabled,
  }
}
