import { EditOutlined } from "@mui/icons-material"
import { Button, Chip, Stack, StackProps, Typography } from "@mui/material"
import { DeepReadonlyArray } from "rxdb/dist/types/types"

export const MetadataItemList = ({
  values,
  label,
  onEditClick,
  emptyLabel = "Unknown",
  ...rest
}: {
  values?: DeepReadonlyArray<string | undefined>
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
      <Stack flexDirection="row" gap={1}>
        {!values?.length && (
          <Typography variant="caption">{emptyLabel}</Typography>
        )}
        {values?.map((item, index) => (
          <Chip
            label={item ?? "unknown"}
            size="medium"
            key={index}
            onClick={() => {}}
          />
        ))}
      </Stack>
    </Stack>
  )
}
