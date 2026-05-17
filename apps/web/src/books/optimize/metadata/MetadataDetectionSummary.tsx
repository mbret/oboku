import { Alert, Chip, Stack, Typography, styled } from "@mui/material"
import type { DetectedContainer } from "./targets"

const ContainersChipStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
}))

type Props = {
  inspectionReady: boolean
  detectedContainers: DetectedContainer[]
  metadataReadFailed: boolean
}

export function MetadataDetectionSummary({
  inspectionReady,
  detectedContainers,
  metadataReadFailed,
}: Props) {
  if (!inspectionReady) {
    return <Typography variant="body2">Waiting for the file…</Typography>
  }

  if (metadataReadFailed) {
    return (
      <Alert severity="error">
        This file could not be opened. Metadata cannot be edited for this format
        or the file is corrupted.
      </Alert>
    )
  }

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
}
