import { useCallback, memo, type ComponentProps } from "react"
import { TagListItemList } from "./TagListItemList"
import { VirtuosoList } from "../../common/lists/VirtuosoList"

const itemStyle = { height: 60 }

export const TagList = memo(
  (
    props: {
      onItemClick?: (tag: { _id: string; isProtected: boolean }) => void
    } & ComponentProps<typeof VirtuosoList>,
  ) => {
    const { onItemClick, ...rest } = props

    const rowRenderer = useCallback(
      (_: number, item: string) => (
        <TagListItemList
          id={item}
          onItemClick={onItemClick}
          style={itemStyle}
        />
      ),
      [onItemClick],
    )

    return <VirtuosoList rowRenderer={rowRenderer} itemsPerRow={1} {...rest} />
  },
)
