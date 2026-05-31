import { Chip, Stack, Typography, styled } from "@mui/material"
import {
  CONTAINER_LABELS,
  type ContainerKey,
  type DetectedContainer,
} from "./targets"
import { useBookOptimize } from "../BookOptimizeProvider"
import { memo } from "react"

const ContainersChipStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
}))

const CONTAINER_ORDER: readonly ContainerKey[] = ["comicInfo", "opf"]

export const collectDetectedContainers = ({
  hasOpf,
  hasComicInfo,
}: {
  hasOpf: boolean
  hasComicInfo: boolean
}): DetectedContainer[] => {
  const present: Record<ContainerKey, boolean> = {
    comicInfo: hasComicInfo,
    opf: hasOpf,
  }

  return CONTAINER_ORDER.filter((key) => present[key]).map((key) => ({
    key,
    label: CONTAINER_LABELS[key],
  }))
}

export const MetadataDetectionSummary = memo(
  function MetadataDetectionSummary() {
    const { inspection } = useBookOptimize()

    const detectedContainers = collectDetectedContainers({
      hasOpf: inspection.hasOpf,
      hasComicInfo: inspection.hasComicInfo,
    })

    return (
      <Stack spacing={1}>
        {detectedContainers.length > 0 ? (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Detected metadata</Typography>
            <ContainersChipStack>
              {detectedContainers.map((container) => (
                <Chip
                  key={container.key}
                  label={container.label}
                  size="small"
                  variant="outlined"
                />
              ))}
            </ContainersChipStack>
          </Stack>
        ) : (
          <Typography variant="body2">
            No embedded metadata containers were found.{" "}
            <Chip
              component="span"
              label="ComicInfo.xml"
              size="small"
              variant="outlined"
            />{" "}
            will be used as the default metadata container.
          </Typography>
        )}
      </Stack>
    )
  },
)
