import { memo } from "react"
import { Stack, useTheme } from "@mui/material"
import { Cover } from "../../books/Cover"
import { useCollection } from "../useCollection"

export const CollectionListItemBookCovers = memo(({ id }: { id: string }) => {
  const theme = useTheme()
  const { data: item } = useCollection({
    id,
  })

  return (
    <Stack position="relative" direction="row" justifyContent="center">
      {item?.books?.slice(0, 3).map((bookItem, i) => {
        const length = item?.books?.length || 0
        const coverHeight = 200 * (length < 3 ? 0.6 : 0.5)

        if (!bookItem) return null

        return (
          <Cover
            key={bookItem}
            bookId={bookItem}
            withShadow
            style={{
              height: coverHeight,
              width: coverHeight * theme.custom.coverAverageRatio,
              ...(length > 2 &&
                i === 1 && {
                  marginTop: -10,
                }),
              marginRight: 5,
              marginLeft: 5,
            }}
          />
        )
      })}
    </Stack>
  )
})
