import { useCallback, memo, type ComponentProps } from "react"
import { SelectableTagListItem } from "./SelectableTagListItem"
import { VirtuosoList } from "../../common/lists/VirtuosoList"

export const SelectableTagList = memo(
  ({
    data,
    onItemClick,
    selected,
    ...rest
  }: {
    selected: Record<string, boolean>
    onItemClick: (id: { id: string; selected: boolean }) => void
  } & ComponentProps<typeof VirtuosoList>) => {
    const rowRenderer = useCallback(
      (_: number, item: string) => (
        <SelectableTagListItem
          id={item}
          selected={!!selected[item]}
          onItemClick={() =>
            onItemClick({ id: item, selected: !!selected[item] })
          }
        />
      ),
      [onItemClick, selected],
    )

    return (
      <VirtuosoList
        data={data}
        rowRenderer={rowRenderer}
        itemsPerRow={1}
        {...rest}
      />
    )
  },
)
