import { CircleRounded, StarRounded } from "@mui/icons-material"
import { Chip, ChipProps, Stack, Typography, capitalize } from "@mui/material"
import { CollectionMetadata } from "@oboku/shared"
import { memo } from "react"

export const StatusChip = memo(
  ({
    rating,
    status,
    ...rest
  }: Pick<CollectionMetadata, "status" | "rating"> & ChipProps) => {
    return (
      <Chip
        label={
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="caption" lineHeight="inherit" color="inherit">
              {capitalize(status ?? "unknown")}
            </Typography>
            {rating !== undefined && (
              <Stack direction="row" alignItems="center">
                <StarRounded fontSize="small" color="warning" />
                <Typography
                  color="warning"
                  variant="caption"
                  lineHeight="inherit"
                  fontWeight="bold"
                >
                  {rating.toFixed(1)}
                </Typography>
              </Stack>
            )}
          </Stack>
        }
        icon={
          <CircleRounded
            color={
              status === "ongoing"
                ? "success"
                : status === "completed"
                  ? "info"
                  : "warning"
            }
          />
        }
        size="small"
        {...rest}
      />
    )
  },
)
