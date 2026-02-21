import { memo, useMemo } from "react"
import { CollectionList as CollectionListComponent } from "../collections/lists/CollectionList"

export const CollectionList = memo(
  ({ data }: { data: string[] | undefined }) => {
    const listStyle = useMemo(
      () => ({
        height: 320,
      }),
      [],
    )

    return (
      <CollectionListComponent
        data={data}
        viewMode="horizontal"
        style={listStyle}
        slotProps={{
          listItem: {
            showType: false,
          },
        }}
      />
    )
  },
)
