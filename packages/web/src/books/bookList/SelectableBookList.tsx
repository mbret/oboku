import { useCallback, memo, type ComponentProps } from "react"
import { useTheme } from "@mui/material"
import { useWindowSize } from "react-use"
import { SelectableBookListItem } from "./SelectableBookListItem"
import { VirtuosoList } from "../../common/lists/VirtuosoList"

export const SelectableBookList = memo(
  (
    props: {
      selected: Record<string, boolean>
      onItemClick: (id: { id: string; selected: boolean }) => void
    } & ComponentProps<typeof VirtuosoList>,
  ) => {
    const theme = useTheme()
    const { data, onItemClick, selected, ...rest } = props
    const windowSize = useWindowSize()
    const itemsPerRow = 1
    const densityMultiplier = 1
    const itemHeight =
      (windowSize.width > theme.breakpoints.values["sm"] ? 150 : 100) *
      theme.custom.coverAverageRatio *
      densityMultiplier

    const rowRenderer = useCallback(
      (_: number, item: string) => (
        <SelectableBookListItem
          bookId={item}
          itemHeight={itemHeight}
          selected={!!selected[item]}
          onItemClick={() =>
            onItemClick({ id: item, selected: !!selected[item] })
          }
        />
      ),
      [itemHeight, onItemClick, selected],
    )

    return (
      <VirtuosoList
        data={data}
        rowRenderer={rowRenderer}
        itemsPerRow={itemsPerRow}
        {...rest}
      />
    )
  },
)
