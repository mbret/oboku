import { Add } from "@mui/icons-material"
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  styled,
} from "@mui/material"
import { useFieldArray } from "react-hook-form"
import { useBookOptimize } from "../BookOptimizeProvider"
import { useIsApplyingLocally } from "../apply/useApplyLocally"
import { IdentifierField } from "./identifiers/IdentifierField"
import { hasWritableMetadataTarget } from "./identifiers/containers"
import { DEFAULT_IDENTIFIER_SCHEME } from "./identifiers/schemes"

const IdentifiersFormHelperText = styled(FormHelperText)(({ theme }) => ({
  margin: theme.spacing(1, 0),
}))

const AddIdentifierButton = styled(Button)(({ theme }) => ({
  alignSelf: "flex-start",
  marginTop: theme.spacing(1),
}))

export function MetadataForm() {
  const { bookId, control, inspection, isUploading } = useBookOptimize()
  const isApplyingLocally = useIsApplyingLocally(bookId)
  const isApplying = isApplyingLocally || isUploading
  const isStorable = hasWritableMetadataTarget(inspection)
  const isDisabled = isApplying || !isStorable
  const { fields, append, remove } = useFieldArray({
    control,
    name: "identifiers",
  })

  return (
    <FormControl component="fieldset" disabled={isDisabled}>
      <FormLabel component="legend">
        Identifiers (e.g. ISBN, Google Books id)
      </FormLabel>
      <IdentifiersFormHelperText>
        {isStorable
          ? "Pick a known scheme or name your own. Saving makes the book carry exactly these identifiers."
          : "This book has nowhere to store identifiers, so they cannot be edited."}
      </IdentifiersFormHelperText>
      <Stack spacing={2}>
        {fields.map(function renderIdentifier(field, index) {
          return (
            <IdentifierField
              key={field.id}
              control={control}
              index={index}
              unique={field.unique}
              disabled={isDisabled}
              onRemove={function removeIdentifier() {
                remove(index)
              }}
            />
          )
        })}
      </Stack>
      <AddIdentifierButton
        startIcon={<Add />}
        disabled={isDisabled}
        onClick={function appendIdentifier() {
          append({
            scheme: DEFAULT_IDENTIFIER_SCHEME,
            value: "",
            unique: false,
          })
        }}
      >
        Add identifier
      </AddIdentifierButton>
    </FormControl>
  )
}
