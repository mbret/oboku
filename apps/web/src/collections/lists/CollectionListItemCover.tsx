import { memo, useState } from "react"
import { Box, useTheme, Stack, Chip } from "@mui/material"
import { FolderRounded, StyleRounded } from "@mui/icons-material"
import { useCollection } from "../useCollection"
import { CollectionListItemBookCovers } from "./CollectionListItemBookCovers"
import { getCollectionComputedMetadata } from "../getCollectionComputedMetadata"
import { CollectionListItemProgress } from "./CollectionListItemProgress"
import { useCollectionReadingProgress } from "../useCollectionReadingProgress"
import { useCollectionCoverUri } from "../useCollectionCoverUri"
import { StatusChip } from "../series/StatusChip"
import { configuration } from "../../config/configuration"

const DefaultBackground = () => {
  const theme = useTheme()

  return (
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
        left: 0,
      }}
    />
  )
}

export const CollectionListItemCover = memo(
  ({ id, showType = true }: { id: string; showType?: boolean }) => {
    const { data: item } = useCollection({
      id,
    })
    const metadata = getCollectionComputedMetadata(item)
    const readingProgress = useCollectionReadingProgress({ id })
    const { uri: coverUri } = useCollectionCoverUri(item)
    const [bgLoaded, setBgLoaded] = useState<string | null>(null)

    return (
      <Stack
        sx={{
          bgcolor: "grey.200",
          flex: 1,
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
          alignItems: "center",
          ...(id === configuration.COLLECTION_EMPTY_ID && {
            opacity: 0.5,
          }),
        }}
        width="100%"
        justifyContent="center"
      >
        {bgLoaded && bgLoaded === coverUri ? null : <DefaultBackground />}
        {!!coverUri && (
          <Box
            position="absolute"
            left={0}
            top={0}
            component="img"
            src={coverUri}
            onLoad={() => setBgLoaded(coverUri)}
            width="100%"
            height="100%"
            sx={{
              opacity: 0.3,
              objectFit: "cover",
              objectPosition: "center center",
            }}
          />
        )}
        <CollectionListItemBookCovers id={id} />
        {id !== configuration.COLLECTION_EMPTY_ID && (
          <>
            <CollectionListItemProgress
              progress={(readingProgress ?? 0) * 100}
            />
            {showType && (
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
                  m: 1,
                }}
              />
            )}
            {item?.type === "series" && (
              <StatusChip
                rating={metadata.rating}
                status={metadata.status}
                sx={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  m: 1,
                }}
              />
            )}
          </>
        )}
      </Stack>
    )
  },
)
