import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import { useController } from "react-hook-form"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import {
  hasImageCompressionOperation,
  type BookOptimizeFormValues,
} from "../form"
import { useBookOptimize } from "../BookOptimizeProvider"
import { useIsApplyingLocally } from "../apply/useApplyLocally"
import {
  CONVERTIBLE_IMAGE_FORMAT_NAMES,
  PRESERVABLE_IMAGE_FORMAT_NAMES,
} from "@oboku/archive-metadata/web"

const convertibleFormats = CONVERTIBLE_IMAGE_FORMAT_NAMES.join(", ")
const preservableFormats = PRESERVABLE_IMAGE_FORMAT_NAMES.join(", ")

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

const ResizeDimensionsFormHelperText = styled(FormHelperText)(({ theme }) => ({
  margin: theme.spacing(1, 0),
}))

const OutputFormatFormHelperText = styled(FormHelperText)(({ theme }) => ({
  marginTop: -theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
}))

const getScreenResolution = (): string => {
  const ratio = window.devicePixelRatio || 1

  return `${Math.round(window.screen.width * ratio)} × ${Math.round(
    window.screen.height * ratio,
  )} px`
}

export function ImageCompressionOption() {
  const { bookId, control, isUploading } = useBookOptimize()
  const isApplyingLocally = useIsApplyingLocally(bookId)
  const isApplying = isApplyingLocally || isUploading
  const {
    field: { value: enabled, onChange: changeCompressionEnabled },
    fieldState: { error },
  } = useController({
    control,
    name: "compressImages",
    rules: {
      validate: (compressImages, values) =>
        !compressImages ||
        hasImageCompressionOperation(values) ||
        "Set a maximum width or height when keeping the original format.",
      deps: ["maxWidth", "maxHeight", "imageOutputMode"],
    },
  })
  const {
    field: { value: outputMode, onChange: changeOutputMode },
  } = useController({
    control,
    name: "imageOutputMode",
    rules: { deps: ["compressImages"] },
  })

  return (
    <OptionStack>
      <FormControlLabel
        control={
          <Checkbox
            checked={enabled}
            disabled={isApplying}
            onChange={function toggleImageCompression(event) {
              changeCompressionEnabled(event.target.checked)
            }}
          />
        }
        label="Compress images"
      />
      <Typography variant="body2" color="text.secondary">
        Choose how eligible images are written and whether they should be
        resized.
      </Typography>
      {enabled && (
        <>
          <FormControl component="fieldset" disabled={isApplying}>
            <FormLabel component="legend">Output format</FormLabel>
            <RadioGroup
              value={outputMode}
              onChange={function selectImageOutputMode(_event, value) {
                if (value === "webp" || value === "original") {
                  changeOutputMode(value)
                }
              }}
            >
              <Stack>
                <FormControlLabel
                  value="original"
                  control={<Radio />}
                  label="Keep original format"
                />
                {outputMode === "original" && (
                  <OutputFormatFormHelperText>
                    {preservableFormats} images are resized in their original
                    format. All other image formats, including BMP, are left
                    unchanged.
                  </OutputFormatFormHelperText>
                )}
              </Stack>
              <Stack>
                <FormControlLabel
                  value="webp"
                  control={<Radio />}
                  label="Convert to WebP"
                />
                {outputMode === "webp" && (
                  <OutputFormatFormHelperText>
                    {convertibleFormats} images are converted to WebP, even
                    without resize dimensions. References are updated, and all
                    other image formats are left unchanged.
                  </OutputFormatFormHelperText>
                )}
              </Stack>
            </RadioGroup>
          </FormControl>
          <FormControl
            component="fieldset"
            disabled={isApplying}
            error={Boolean(error)}
          >
            <FormLabel component="legend">Resize dimensions</FormLabel>
            <ResizeDimensionsFormHelperText>
              Optional for WebP conversion and required when keeping the
              original format. Aspect ratio is preserved; leave either field
              empty to constrain only the other dimension.
            </ResizeDimensionsFormHelperText>
            <DimensionsStack>
              <ControlledTextField<BookOptimizeFormValues>
                control={control}
                name="maxWidth"
                rules={{ deps: ["compressImages"] }}
                label="Max width (px)"
                type="number"
                size="small"
                fullWidth
                disabled={isApplying}
              />
              <ControlledTextField<BookOptimizeFormValues>
                control={control}
                name="maxHeight"
                rules={{ deps: ["compressImages"] }}
                label="Max height (px)"
                type="number"
                size="small"
                fullWidth
                disabled={isApplying}
              />
            </DimensionsStack>
            <ResizeDimensionsFormHelperText>
              This device&apos;s screen has {getScreenResolution()} physical
              pixels. Images larger than this won&apos;t look any sharper here.
            </ResizeDimensionsFormHelperText>
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        </>
      )}
    </OptionStack>
  )
}
