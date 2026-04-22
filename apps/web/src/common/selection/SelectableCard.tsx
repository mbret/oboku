import type { ReactNode } from "react"
import { CheckCircleRounded, CircleOutlined } from "@mui/icons-material"
import {
  Box,
  ButtonBase,
  styled,
  type BoxProps,
  type ButtonBaseProps,
} from "@mui/material"
import type { useSelectableItemInteractions } from "./useSelectableItemInteractions"

const OPACITY_TRANSITION = "opacity 150ms ease"

const SelectionOverlayRegion = styled(Box, {
  shouldForwardProp: (prop) =>
    !["selected", "selectionMode", "selectionEnabled"].includes(
      prop.toString(),
    ),
})<{
  selected: boolean
  selectionMode: boolean
  selectionEnabled: boolean
}>(({ theme, selected, selectionMode, selectionEnabled }) => {
  const overlayVisible = selectionMode || selected

  return {
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 96,
      opacity: overlayVisible ? 1 : 0,
      background:
        "linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 20%, rgba(0, 0, 0, 0.3) 45%, rgba(0, 0, 0, 0.12) 70%, rgba(0, 0, 0, 0) 100%)",
      pointerEvents: "none",
      transition: OPACITY_TRANSITION,
      zIndex: 1,
    },
    "& .selection-overlay-toggle": {
      position: "absolute",
      top: theme.spacing(1),
      left: theme.spacing(1),
      zIndex: 2,
      opacity: selected ? 1 : selectionMode ? 0.7 : 0,
      visibility: overlayVisible ? "visible" : "hidden",
      pointerEvents: overlayVisible ? "auto" : "none",
      transition: `${OPACITY_TRANSITION}, visibility 150ms ease`,
    },
    ...(selectionEnabled &&
      !selected && {
        "@media (hover: hover)": {
          "&:hover::before": {
            opacity: 1,
          },
          "&:hover .selection-overlay-toggle": {
            opacity: 0.7,
            visibility: "visible",
            pointerEvents: "auto",
          },
          "& .selection-overlay-toggle:hover": {
            opacity: 1,
          },
          "&:hover .selection-overlay-icon-default": {
            opacity: 0,
          },
          "&:hover .selection-overlay-icon-hover": {
            opacity: 1,
          },
        },
      }),
  }
})

const SelectionToggleButton = styled(ButtonBase)(({ theme }) => ({
  borderRadius: "50%",
  color: theme.palette.common.white,
  "& .selection-overlay-icon-stack": {
    position: "relative",
    display: "inline-flex",
    width: 24,
    height: 24,
  },
  "& .selection-overlay-icon-stack > svg": {
    position: "absolute",
    inset: 0,
    display: "block",
    fontSize: 24,
    transition: "opacity 120ms ease",
  },
  "& .selection-overlay-icon-hover": {
    opacity: 0,
  },
  "& svg": {
    display: "block",
    fontSize: 24,
  },
}))

function SelectionToggle({
  selected,
  ...props
}: {
  selected: boolean
} & ButtonBaseProps) {
  return (
    <SelectionToggleButton className="selection-overlay-toggle" {...props}>
      {selected ? (
        <CheckCircleRounded />
      ) : (
        <span className="selection-overlay-icon-stack">
          <CircleOutlined className="selection-overlay-icon-default" />
          <CheckCircleRounded className="selection-overlay-icon-hover" />
        </span>
      )}
    </SelectionToggleButton>
  )
}

type SelectableItemInteractions = ReturnType<
  typeof useSelectableItemInteractions
>

export function SelectableCardOverlay({
  children,
  selected = false,
  selectionMode = false,
  selectionEnabled,
  controlProps,
  itemLabel = "item",
  ...props
}: {
  children: ReactNode
  selected?: boolean
  selectionMode?: boolean
  selectionEnabled: SelectableItemInteractions["selectionEnabled"]
  controlProps: SelectableItemInteractions["controlProps"]
  itemLabel?: string
} & BoxProps) {
  return (
    <SelectionOverlayRegion
      selected={selected}
      selectionMode={selectionMode}
      selectionEnabled={selectionEnabled}
      {...props}
    >
      {selectionEnabled && (
        <SelectionToggle
          selected={selected}
          aria-label={
            selected ? `Unselect this ${itemLabel}` : `Select this ${itemLabel}`
          }
          {...controlProps}
        />
      )}
      {children}
    </SelectionOverlayRegion>
  )
}
