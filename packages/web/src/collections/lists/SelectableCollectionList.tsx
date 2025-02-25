import { useCallback, memo, ComponentProps } from "react"
import { SelectableCollectionListItem } from "./SelectableCollectionListItem"
import { VirtuosoList } from "../../common/lists/VirtuosoList"

export const SelectableCollectionList = memo(
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
        <SelectableCollectionListItem
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
