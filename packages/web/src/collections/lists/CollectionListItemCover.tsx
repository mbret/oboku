import { memo } from "react"
import {
  Box,
  useTheme,
  Stack,
  Chip,
  capitalize,
  Typography
} from "@mui/material"
import {
  CircleRounded,
  FolderRounded,
  StarRounded,
  StyleRounded
} from "@mui/icons-material"
import { useCollection } from "../useCollection"
import { COLLECTION_EMPTY_ID } from "../../constants.shared"
import { CollectionListItemBookCovers } from "./CollectionListItemBookCovers"
import { getCollectionComputedMetadata } from "../getCollectionComputedMetadata"
import { CollectionListItemProgress } from "./CollectionListItemProgress"
import { useCollectionReadingProgress } from "../useCollectionReadingProgress"
import { useCollectionCoverUri } from "../useCollectionCoverUri"

export const CollectionListItemCover = memo(({ id }: { id: string }) => {
  const theme = useTheme()
  const { data: item } = useCollection({
    id
  })
  const metadata = getCollectionComputedMetadata(item)
  const readingProgress = useCollectionReadingProgress({ id })
  const { hasCover, uri: coverUri } = useCollectionCoverUri(item)

  return (
    <Stack
      sx={{
        bgcolor: "grey.200",
        flex: 1,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        alignItems: "center",
        ...(id === COLLECTION_EMPTY_ID && {
          opacity: 0.5
        })
      }}
      width="100%"
      justifyContent="center"
    >
      {!!coverUri ? (
        <Box
          position="absolute"
          left={0}
          top={0}
          component="img"
          src={coverUri}
          width="100%"
          height="100%"
          borderRadius={1}
          sx={{
            opacity: 0.4,
            objectFit: "cover",
            objectPosition: "center center"
          }}
        />
      ) : (
        <Box
          style={{
            backgroundColor: theme.palette.grey[300],
            height: "50%",
            width: "100%",
            borderTopLeftRadius: "50%",
            borderTopRightRadius: "50%",
            alignSelf: "flex-end",
            position: "absolute",
            bottom: 0,
            left: 0
          }}
        />
      )}
      <CollectionListItemBookCovers id={id} />
      {id !== COLLECTION_EMPTY_ID && (
        <>
          <CollectionListItemProgress progress={readingProgress * 100} />
          <Chip
            label={item?.type === "series" ? "Series" : "Collection"}
            color="primary"
            size="small"
            icon={
              item?.type === "series" ? <StyleRounded /> : <FolderRounded />
            }
            sx={{
              position: "absolute",
              left: 0,
              bottom: 0,
              m: 1
            }}
          />
          {item?.type === "series" && (
            <Chip
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography
                    variant="caption"
                    lineHeight="inherit"
                    color="inherit"
                  >
                    {capitalize(metadata.status ?? "unknown")}
                  </Typography>
                  {metadata.rating !== undefined && (
                    <Stack direction="row" alignItems="center">
                      <StarRounded fontSize="small" color="warning" />
                      <Typography
                        color="warning"
                        variant="caption"
                        lineHeight="inherit"
                        fontWeight="bold"
                      >
                        {metadata.rating.toFixed(1)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              }
              icon={
                <CircleRounded
                  color={
                    metadata.status === "ongoing"
                      ? "success"
                      : metadata.status === "completed"
                        ? "info"
                        : "warning"
                  }
                />
              }
              size="small"
              sx={{
                bgcolor: "white",
                position: "absolute",
                right: 0,
                bottom: 0,
                m: 1
              }}
            />
          )}
        </>
      )}
    </Stack>
  )
})
