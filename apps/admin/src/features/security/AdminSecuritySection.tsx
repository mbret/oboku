import {
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import {
  AudienceFields,
  type AudienceFormValues,
  parseEmails,
  validateRecipientEmails,
} from "@/components/AudienceFields"
import { ConfirmModal, useConfirmableSubmit } from "@/components/ConfirmModal"
import { useRevokeTokens } from "./useRevokeTokens"
import { useTokenStats } from "./useTokenStats"

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Paper withBorder p="md">
    <Text size="xl" fw={700}>
      {value.toLocaleString()}
    </Text>
    <Text size="sm" c="dimmed">
      {label}
    </Text>
  </Paper>
)

export const AdminSecuritySection = () => {
  const stats = useTokenStats()
  const revokeTokens = useRevokeTokens()
  const confirmation = useConfirmableSubmit<AudienceFormValues>()
  const { pendingValues } = confirmation

  const form = useForm<AudienceFormValues>({
    mode: "controlled",
    initialValues: {
      audienceType: "all",
      recipientEmails: "",
    },
    validate: {
      recipientEmails: validateRecipientEmails,
    },
  })

  const audienceSummary = pendingValues
    ? pendingValues.audienceType === "all"
      ? "every session for every user"
      : `${parseEmails(pendingValues.recipientEmails).length} user(s) by email`
    : ""

  const handleConfirmRevoke = () => {
    if (!pendingValues) return

    revokeTokens.mutate(
      {
        audienceType: pendingValues.audienceType,
        emails:
          pendingValues.audienceType === "emails"
            ? parseEmails(pendingValues.recipientEmails)
            : undefined,
      },
      {
        onSuccess: () => {
          form.reset()
          confirmation.reset()
        },
      },
    )
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3} mb="xs">
          Security
        </Title>
        <Text size="sm" c="dimmed">
          Inspect issued refresh tokens and revoke sessions when a compromise is
          suspected.
        </Text>
      </div>

      <Paper withBorder p="md">
        <Group justify="space-between" align="center" mb="sm">
          <Text size="sm" fw={500}>
            Refresh tokens
          </Text>
          <Button
            variant="light"
            onClick={() => stats.refetch()}
            loading={stats.isFetching}
          >
            refresh
          </Button>
        </Group>

        {stats.isLoading && (
          <Text size="sm" c="dimmed">
            Loading token stats…
          </Text>
        )}
        {stats.error && (
          <Text size="sm" c="red">
            Error: {stats.error.message}
          </Text>
        )}
        {stats.data && (
          <SimpleGrid cols={{ base: 2, sm: 4 }}>
            <StatCard label="Total tokens" value={stats.data.totalTokens} />
            <StatCard label="Active tokens" value={stats.data.activeTokens} />
            <StatCard label="Distinct users" value={stats.data.distinctUsers} />
            <StatCard
              label="Active sessions"
              value={stats.data.distinctSessions}
            />
          </SimpleGrid>
        )}
      </Paper>

      <Paper withBorder p="md">
        <form onSubmit={form.onSubmit(confirmation.request)}>
          <Stack gap="sm">
            <div>
              <Text size="sm" fw={500}>
                Revoke tokens
              </Text>
              <Text size="sm" c="dimmed">
                Revoked tokens are deleted from the database. Affected users are
                signed out and must log in again.
              </Text>
            </div>

            <AudienceFields
              form={form}
              groupLabel="Target"
              everyoneLabel="Everyone (broadcast)"
              everyoneDescription="Delete every refresh token in the database."
              specificLabel="Specific users"
              specificDescription="Only revoke tokens for the provided email addresses."
              emailsLabel="User emails"
            />

            <Group justify="flex-end">
              <Button type="submit" color="red">
                revoke tokens
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <ConfirmModal
        opened={confirmation.opened}
        onClose={confirmation.close}
        title="Revoke these tokens?"
        confirmLabel={`Revoke ${audienceSummary}`}
        onConfirm={handleConfirmRevoke}
        pending={revokeTokens.isPending}
      >
        <Text size="sm">
          You're about to revoke <strong>{audienceSummary}</strong>. This signs
          the affected users out and can't be undone.
        </Text>
      </ConfirmModal>
    </Stack>
  )
}
