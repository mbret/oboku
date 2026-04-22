import { useKey } from "react-use"

export type EscapeLayer = "base" | "modal"

const escapeLayerRanks = {
  base: 0,
  modal: 1,
} satisfies Record<EscapeLayer, number>

function getEscapeLayerRank(layer: EscapeLayer) {
  return escapeLayerRanks[layer]
}

function getActiveExternalEscapeLayer(): EscapeLayer | undefined {
  if (typeof document === "undefined") {
    return undefined
  }

  // Detect open modal surfaces via ARIA rather than MUI class names so this
  // stays decoupled from MUI internals (and works with any accessible modal).
  return document.querySelector('[aria-modal="true"]') !== null
    ? "modal"
    : undefined
}

export function useLayeredEscape({
  enabled = true,
  layer,
  onEscape,
}: {
  enabled?: boolean
  layer: EscapeLayer
  onEscape: (event: KeyboardEvent) => void
}) {
  useKey(
    enabled ? "Escape" : null,
    (event) => {
      if (event.defaultPrevented) {
        return
      }

      const activeExternalEscapeLayer = getActiveExternalEscapeLayer()

      if (
        activeExternalEscapeLayer &&
        getEscapeLayerRank(activeExternalEscapeLayer) >
          getEscapeLayerRank(layer)
      ) {
        return
      }

      onEscape(event)
    },
    undefined,
    [enabled, layer, onEscape],
  )
}
