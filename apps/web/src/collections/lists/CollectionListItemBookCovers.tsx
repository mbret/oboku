import { memo } from "react"
import { Box, useTheme } from "@mui/material"
import { Cover } from "../../books/Cover"
import { useCollection } from "../useCollection"

export const CollectionListItemBookCovers = memo(({ id }: { id: string }) => {
  const theme = useTheme()
  const { data: item } = useCollection({
    id,
  })
  const items = item?.books?.slice(0, 3)
  const size = items?.length || 0

  return (
    <Box
      position="absolute"
      display="flex"
      flexDirection="row"
      width="80%"
      height="70%"
      sx={{
        containerType: "size",
      }}
    >
      {items?.map((bookItem, i) => {
        if (!bookItem) return null

        const coverWidth = `100cqh * ${theme.custom.coverAverageRatio}`
        const availableSpace = `(100cqw - ${coverWidth})` // Space after placing last cover
        const idealSpacing = `${availableSpace} / max(1, ${size - 1})` // Ideal spacing between covers
        const maxSpacing = `calc(${coverWidth} + 12px)` // Maximum spacing = cover width (side by side)
        const reCenterTranslate = `translateX(calc((100cqw - ${coverWidth} - (${size - 1}) * min(${idealSpacing}, ${maxSpacing})) / 2))`

        return (
          <Cover
            key={bookItem}
            bookId={bookItem}
            withShadow
            style={{
              position: "absolute",
              height: "100%",
            }}
            sx={{
              "@container (min-width: 0)": {
                width: `calc(${coverWidth})`,
                // adjust the cover so they expand / overlap when needed
                left: `calc(${i} * max(0px, min(${idealSpacing}, ${maxSpacing})))`,
                transform: `${reCenterTranslate}${i === 1 ? " scale(1.1)" : ""}`,
              },
            }}
          />
        )
      })}
    </Box>
  )
})
