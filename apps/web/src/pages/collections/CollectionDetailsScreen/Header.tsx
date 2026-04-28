import { Box, Chip, Stack, Typography, useTheme } from "@mui/material"
import { memo } from "react"
import { useCollectionCoverUri } from "../../../collections/useCollectionCoverUri"
import { useLocalSettings } from "../../../settings/useLocalSettings"
import { useCollection } from "../../../collections/useCollection"
import coverPlaceholder from "../../../assets/cover-placeholder.jpg"
import CollectionBgSvg from "../../../assets/series-bg.svg"
import { StatusChip } from "../../../collections/series/StatusChip"
import { useCollectionComputedMetadata } from "../../../collections/useCollectionComputedMetadata"

export const Header = memo(({ id }: { id: string | undefined }) => {
  const theme = useTheme()
  const { themeMode } = useLocalSettings()
  const useOptimizedTheme = themeMode === "e-ink"
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
      style={{
        backgroundImage: useOptimizedTheme
          ? undefined
          : `url(${hasCover ? (coverUri ?? coverPlaceholder) : CollectionBgSvg})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      sx={{
        position: "relative",
        pt: headerPt,
        minHeight: headerHeight,
        px: 2,
      }}
    >
      {!useOptimizedTheme && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "100%",
            background: `linear-gradient(to bottom, color-mix(in srgb, ${theme.palette.background.default} 70%, transparent) 10%, ${theme.palette.background.default} 100%)`,
          }}
        />
      )}
      <Stack
        direction="row"
        sx={{
          gap: 2,
          justifyContent: "flex-start",
        }}
      >
        {!!hasCover && (
          <Box
            component="img"
            src={coverUri ?? coverPlaceholder}
            sx={{
              position: "relative",
              width: coverWidth,
              height: coverHeight,
              borderRadius: 1,
              objectFit: "cover",
              objectPosition: "center center",
            }}
          />
        )}
        <Stack
          sx={{
            pt: hasCover ? 0.5 : 0,
            position: "relative",
            alignItems: "flex-start",
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: "bold",
              typography: ["h6", "h4"],
            }}
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
            <Stack
              direction="row"
              sx={{
                gap: 1,
                alignItems: "center",
              }}
            >
              <Typography variant="body2">Publisher:</Typography>
              {metadata.publisherName && (
                <Chip size="small" label={metadata.publisherName} />
              )}
            </Stack>
          )}
          <Stack
            direction="row"
            sx={{
              gap: 1,
              alignItems: "center",
            }}
          >
            {!!metadata.startYear && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                }}
              >
                {metadata.startYear}
              </Typography>
            )}
            {collection?.type === "series" && (
              <StatusChip rating={metadata.rating} status={metadata.status} />
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
})
