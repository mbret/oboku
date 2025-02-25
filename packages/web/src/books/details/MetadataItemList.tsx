import { EditOutlined } from "@mui/icons-material"
import { Button, Chip, Stack, StackProps, Typography } from "@mui/material"
import { Link } from "react-router"
import { DeepReadonlyArray } from "rxdb/dist/types/types"

export const MetadataItemList = ({
  values,
  label,
  onEditClick,
  emptyLabel = "Unknown",
  ...rest
}: {
  values?: DeepReadonlyArray<{ label?: string; to?: string }>
  label: string
  emptyLabel?: string
  onEditClick?: () => void
} & StackProps) => {
  return (
    <Stack alignItems="flex-start" gap={0.5} {...rest}>
      <Stack flexDirection="row" gap={1} alignItems="center">
        <Typography fontWeight="bold">{label}</Typography>
        {!!onEditClick && (
          <Button
            size="small"
            variant="text"
            onClick={onEditClick}
            startIcon={<EditOutlined />}
          >
            Edit
          </Button>
        )}
      </Stack>
      <Stack flexDirection="row" gap={1} flexWrap="wrap">
        {!values?.length && (
          <Typography variant="caption">{emptyLabel}</Typography>
        )}
        {values?.map((item, index) => (
          <Chip
            label={item.label ?? "unknown"}
            size="medium"
            key={index}
            style={{
              maxWidth: 320,
            }}
            {...(item.to && {
              clickable: true,
              to: item.to,
              component: Link,
            })}
          />
        ))}
      </Stack>
    </Stack>
  )
}
