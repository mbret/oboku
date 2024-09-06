import { useTheme } from "@mui/material"
import { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import { useWindowSize } from "react-use"

export const useListItemHeight = ({
  viewMode,
  density
}: {
  viewMode: ListActionViewMode
  density: "large" | "dense"
}) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const densityMultiplier = density === "dense" ? 0.8 : 1

  const listItemMargin =
    (windowSize.width > theme.breakpoints.values["sm"] ? 15 : 10) *
    densityMultiplier

  const compactItemMargin =
    (windowSize.width > theme.breakpoints.values["sm"] ? 15 : 10) *
    densityMultiplier

  const listItemHeight =
    ((windowSize.width > theme.breakpoints.values["sm"] ? 200 : 150) *
      theme.custom.coverAverageRatio +
      listItemMargin) *
    densityMultiplier

  const compactItemHeight =
    ((windowSize.width > theme.breakpoints.values["sm"] ? 80 : 80) *
      theme.custom.coverAverageRatio +
      compactItemMargin) *
    densityMultiplier

  const itemHeight =
    viewMode === "grid" || viewMode === "horizontal"
      ? undefined
      : viewMode === "list"
        ? listItemHeight
        : compactItemHeight

  const itemMargin =
    viewMode === "grid" || viewMode === "horizontal"
      ? 0
      : viewMode === "list"
        ? listItemMargin
        : compactItemMargin

  return { itemHeight, itemMargin }
}
