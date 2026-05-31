import { Stack, Typography, styled } from "@mui/material"
import type { Control } from "react-hook-form"
import { normalizeIsbn } from "@oboku/archive-metadata"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import type { BookOptimizeFormValues } from "../form"
import type { MetadataFormSection } from "./targets"

const validateIsbn = (raw: string | boolean): true | string => {
  if (typeof raw !== "string") return true

  const trimmed = raw.trim()

  if (trimmed === "") return true

  return normalizeIsbn(trimmed) !== undefined
    ? true
    : "Not a recognizable ISBN-10 or ISBN-13"
}

const MetadataSectionStack = styled(Stack)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  gap: theme.spacing(1),
  padding: theme.spacing(1.5),
}))

const getHelperText = (section: MetadataFormSection): string | undefined => {
  return section.isbn ? undefined : "No ISBN found."
}

type Props = {
  control: Control<BookOptimizeFormValues>
  sections: MetadataFormSection[]
  disabled: boolean
}

export function MetadataForm({ control, sections, disabled }: Props) {
  return (
    <Stack spacing={2}>
      {sections.map((section) => (
        <MetadataSectionStack key={section.key}>
          <Typography variant="subtitle2">{section.label}</Typography>
          <ControlledTextField<BookOptimizeFormValues>
            name={section.fieldName}
            control={control}
            rules={{ validate: validateIsbn }}
            label="ISBN"
            size="small"
            fullWidth
            helperText={getHelperText(section)}
            disabled={disabled}
          />
        </MetadataSectionStack>
      ))}
    </Stack>
  )
}
