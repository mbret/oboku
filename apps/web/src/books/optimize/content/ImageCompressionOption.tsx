import {
  Alert,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import { useController, type Control } from "react-hook-form"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import { hasCompressionDimension, type BookOptimizeFormValues } from "../form"

const OptionStack = styled(Stack)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  gap: theme.spacing(1),
}))

const DimensionsStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  gap: theme.spacing(1),
}))

const getScreenResolution = (): string => {
  const ratio = window.devicePixelRatio || 1

  return `${Math.round(window.screen.width * ratio)} × ${Math.round(
    window.screen.height * ratio,
  )} px`
}

type Props = {
  control: Control<BookOptimizeFormValues>
  disabled: boolean
}

export function ImageCompressionOption({ control, disabled }: Props) {
  const {
    field: { value: enabled, onChange },
    fieldState: { error },
  } = useController({
    control,
    name: "compressImages",
    rules: {
      validate: (compressImages, values) =>
        !compressImages ||
        hasCompressionDimension(values) ||
        "Set a maximum width or height to compress.",
      deps: ["maxWidth", "maxHeight"],
    },
  })

  return (
    <OptionStack>
      <FormControlLabel
        control={
          <Checkbox
            checked={enabled}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
          />
        }
        label="Compress images"
      />
      <Typography variant="body2" color="text.secondary">
        Resize images to fit within the dimensions below (their aspect ratio
        will be preserved). Leave a field empty to constrain only the other
        dimension.
      </Typography>
      {enabled && (
        <>
          <Typography variant="caption" color="text.secondary">
            This device&apos;s screen has {getScreenResolution()} physical
            pixels. Images larger than this won&apos;t look any sharper here, so
            it&apos;s a sensible upper bound for the maximum width or height.
          </Typography>
          <DimensionsStack>
            <ControlledTextField<BookOptimizeFormValues>
              control={control}
              name="maxWidth"
              rules={{ deps: ["compressImages"] }}
              label="Max width (px)"
              type="number"
              size="small"
              fullWidth
              disabled={disabled}
            />
            <ControlledTextField<BookOptimizeFormValues>
              control={control}
              name="maxHeight"
              rules={{ deps: ["compressImages"] }}
              label="Max height (px)"
              type="number"
              size="small"
              fullWidth
              disabled={disabled}
            />
          </DimensionsStack>
          {error && (
            <Typography variant="caption" color="error">
              {error.message}
            </Typography>
          )}
          <Alert severity="info">
            Images will be converted to WebP for the best size and every
            reference to them inside the book will be updated.
          </Alert>
        </>
      )}
    </OptionStack>
  )
}
