import { Button, ListSubheader, Stack, styled } from "@mui/material"
import type { BookMetadata, UserMetadata } from "@oboku/shared"
import { useForm } from "react-hook-form"
import type { DeepReadonlyObject } from "rxdb"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import { notify, notifyError } from "../../../notifications/toasts"
import { useIncrementalBookModify } from "../../useIncrementalBookModify"

type Props = {
  bookId: string
  metadata: DeepReadonlyObject<UserMetadata> | undefined
}

type FormValues = {
  isbn: string
}

const upsertUserMetadata = (
  metadata: BookMetadata[] | undefined,
  patch: Partial<Omit<UserMetadata, "type">>,
): BookMetadata[] => {
  const list = metadata ?? []
  const existing = list.find(
    (item): item is UserMetadata => item.type === "user",
  )
  const others = list.filter((item) => item.type !== "user")
  const next: UserMetadata = { ...existing, ...patch, type: "user" }

  return [...others, next]
}

const FORM_ID = "user-metadata-form"

/**
 * Pushes the save action to the bottom of the surrounding flex column
 * via `mt: auto`. The button itself is `fullWidth`, which gives the
 * right look on mobile where the container spans the screen.
 */
const SaveActionStack = styled(Stack)(({ theme }) => ({
  marginTop: "auto",
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
}))

const FieldsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

/**
 * User source detail. Currently exposes ISBN as the only editable field
 * (additional editable fields can be added here as new rows). Edits are
 * staged in a form so the user must explicitly hit "Save" — `isDirty`
 * gates the button so unchanged values can't be submitted.
 */
export const UserSourceContent = ({ bookId, metadata }: Props) => {
  const { mutate: modifyBook, isPending } = useIncrementalBookModify()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { isbn: "" },
    /**
     * `values` keeps the form in sync with the source of truth: when a
     * remote edit (or another tab) updates `metadata.isbn`, react-hook-form
     * resets the field — but only while the form is pristine, so an
     * in-flight edit isn't clobbered.
     */
    values: { isbn: metadata?.isbn ?? "" },
  })

  const onSubmit = handleSubmit((values) => {
    const trimmed = values.isbn.trim()

    modifyBook(
      {
        doc: bookId,
        mutationFn: (old) => ({
          ...old,
          metadata: upsertUserMetadata(old.metadata, {
            isbn: trimmed === "" ? undefined : trimmed,
          }),
        }),
      },
      {
        onSuccess: () => {
          notify("actionSuccess")
          reset({ isbn: trimmed })
        },
        onError: notifyError,
      },
    )
  })

  return (
    <Stack
      component="form"
      id={FORM_ID}
      onSubmit={onSubmit}
      noValidate
      sx={{ flex: 1, minHeight: 0 }}
    >
      <FieldsStack>
        <ListSubheader disableGutters>Fields</ListSubheader>
        <ControlledTextField
          control={control}
          name="isbn"
          label="ISBN"
          size="small"
          fullWidth
          disabled={isPending}
        />
      </FieldsStack>
      <SaveActionStack>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!isDirty || !isValid || isPending}
        >
          Save
        </Button>
      </SaveActionStack>
    </Stack>
  )
}
