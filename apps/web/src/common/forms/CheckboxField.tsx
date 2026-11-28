import {
  Checkbox,
  FormControlLabel,
  Stack,
  styled,
  Typography,
} from "@mui/material"

const CheckboxFieldStack = styled(Stack)(function styleCheckboxFieldStack({
  theme,
}) {
  return {
    gap: theme.spacing(0.5),
  }
})

const CaptionTypography = styled(Typography)(function styleCaptionTypography({
  theme,
}) {
  return {
    color: theme.palette.text.secondary,
  }
})

export function CheckboxField({
  checked,
  onChange,
  label,
  caption,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  caption?: string
}) {
  return (
    <CheckboxFieldStack>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={function reportChecked(_, isChecked) {
              onChange(isChecked)
            }}
          />
        }
        label={label}
      />
      {caption !== undefined && (
        <CaptionTypography variant="caption">{caption}</CaptionTypography>
      )}
    </CheckboxFieldStack>
  )
}
