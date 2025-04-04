import { Box, Stack, Typography, useTheme } from "@mui/material"
import { memo } from "react"
import { useCollectionCoverUri } from "../../../collections/useCollectionCoverUri"
import { useLocalSettings } from "../../../settings/states"
import { useCollection } from "../../../collections/useCollection"
import coverPlaceholder from "../../../assets/cover-placeholder.jpg"
import CollectionBgSvg from "../../../assets/series-bg.svg"
import { StatusChip } from "../../../collections/series/StatusChip"
import { useCollectionComputedMetadata } from "../../../collections/useCollectionComputedMetadata"

export const Header = memo(({ id }: { id: string }) => {
  const theme = useTheme()
  const { useOptimizedTheme } = useLocalSettings()
  const { data: collection } = useCollection({
    id,
  })
  const { uri: coverUri, hasCover } = useCollectionCoverUri(collection)
  const metadata = useCollectionComputedMetadata(collection)
  const headerPt = [
    `calc(${theme.spacing(1)} + ${50}px)`,
    `calc(${theme.spacing(1)} + ${60}px)`,
    `calc(${theme.spacing(1)} + ${70}px)`,
  ]
  const headerHeight = [
    `calc(${headerPt[0]} + 100px)`,
    `calc(${headerPt[1]} + 150px)`,
    `calc(${headerPt[2]} + 250px)`,
  ]
  const coverHeight = [
    `calc(${headerHeight[0]} - ${headerPt[0]})`,
    `calc(${headerHeight[1]} - ${headerPt[1]})`,
    `calc(${headerHeight[2]} - ${headerPt[2]})`,
  ]
  const coverWidth = [
    `calc(${coverHeight[0]} / 1.5)`,
    `calc(${coverHeight[1]} / 1.5)`,
    `calc(${coverHeight[2]} / 1.5)`,
  ]

  return (
    <Stack
      position="relative"
      pt={headerPt}
      minHeight={headerHeight}
      px={2}
      style={{
        backgroundImage: useOptimizedTheme
          ? undefined
          : `url(${hasCover ? (coverUri ?? coverPlaceholder) : CollectionBgSvg})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!useOptimizedTheme && (
        <Box
          position="absolute"
          left={0}
          top={0}
          height="100%"
          width="100%"
          sx={{
            background:
              "linear-gradient(to bottom,rgb(255 255 255 / 0.7) 10%, rgb(255 255 255 / 1) 100%)",
          }}
        />
      )}
      <Stack direction="row" gap={2} justifyContent="flex-start">
        {!!hasCover && (
          <Box
            position="relative"
            component="img"
            src={coverUri ?? coverPlaceholder}
            width={coverWidth}
            height={coverHeight}
            borderRadius={1}
            sx={{
              objectFit: "cover",
              objectPosition: "center center",
            }}
          />
        )}
        <Stack
          pt={hasCover ? 0.5 : 0}
          position="relative"
          alignItems="flex-start"
        >
          <Typography
            component="h1"
            sx={{
              typography: ["h6", "h4"],
            }}
            fontWeight="bold"
          >
            {metadata.displayTitle}
          </Typography>
          <Typography
            sx={{
              typography: ["body2", "body1"],
            }}
            gutterBottom
          >
            {`${collection?.books?.length || 0} book(s)`}
          </Typography>
          {collection?.type === "series" && (
            <StatusChip
              rating={metadata.rating}
              status={metadata.status}
              sx={{
                bgcolor: "transparent",
              }}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  )
})
