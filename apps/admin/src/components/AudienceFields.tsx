import { Radio, Stack, Textarea } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"

export type AudienceFormValues = {
  audienceType: "all" | "emails"
  recipientEmails: string
}

export const parseEmails = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

export const validateRecipientEmails = (
  value: string,
  values: AudienceFormValues,
) =>
  values.audienceType === "emails" && parseEmails(value).length === 0
    ? "Provide at least one email"
    : null

type AudienceFieldsProps<TValues extends AudienceFormValues> = {
  form: UseFormReturnType<TValues>
  groupLabel: string
  everyoneLabel: string
  everyoneDescription: string
  specificLabel: string
  specificDescription: string
  emailsLabel: string
}

export const AudienceFields = <TValues extends AudienceFormValues>({
  form,
  groupLabel,
  everyoneLabel,
  everyoneDescription,
  specificLabel,
  specificDescription,
  emailsLabel,
}: AudienceFieldsProps<TValues>) => (
  <>
    <Radio.Group label={groupLabel} {...form.getInputProps("audienceType")}>
      <Stack gap="xs" mt="xs">
        <Radio
          value="all"
          label={everyoneLabel}
          description={everyoneDescription}
        />
        <Radio
          value="emails"
          label={specificLabel}
          description={specificDescription}
        />
      </Stack>
    </Radio.Group>
    {form.values.audienceType === "emails" && (
      <Textarea
        label={emailsLabel}
        description="Separate addresses with commas or new lines."
        placeholder={"reader@example.com\nteam@example.com"}
        minRows={4}
        autosize
        {...form.getInputProps("recipientEmails")}
      />
    )}
  </>
)
