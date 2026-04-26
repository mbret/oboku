import { CircleRounded, StarRounded } from "@mui/icons-material"
import {
  Chip,
  type ChipProps,
  Stack,
  Typography,
  capitalize,
} from "@mui/material"
import type { CollectionMetadata } from "@oboku/shared"
import { memo } from "react"

export const StatusChip = memo(
  ({
    rating,
    status,
    ...rest
  }: Pick<CollectionMetadata, "status" | "rating"> & ChipProps) => {
    return (
      <Chip
        variant="filled"
        color="primary"
        label={
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                lineHeight: "inherit",
                color: "inherit",
              }}
            >
              {capitalize(status ?? "unknown")}
            </Typography>
            {typeof rating === "number" && (
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                }}
              >
                <StarRounded fontSize="small" color="warning" />
                <Typography
                  color="warning"
                  variant="caption"
                  sx={{
                    lineHeight: "inherit",
                    fontWeight: "bold",
                  }}
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
                  : "disabled"
            }
          />
        }
        size="small"
        {...rest}
      />
    )
  },
)
