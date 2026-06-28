import {
  Button,
  Group,
  Modal,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import { useRevokeTokens } from "./useRevokeTokens"
import { useTokenStats } from "./useTokenStats"

type RevokeFormValues = {
  audienceType: "all" | "emails"
  recipientEmails: string
}

const parseEmails = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

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
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false)
  const [pendingValues, setPendingValues] = useState<RevokeFormValues | null>(
    null,
  )

  const form = useForm<RevokeFormValues>({
    mode: "controlled",
    initialValues: {
      audienceType: "all",
      recipientEmails: "",
    },
    validate: {
      recipientEmails: (value, values) =>
        values.audienceType === "emails" && parseEmails(value).length === 0
          ? "Provide at least one email"
          : null,
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
          setPendingValues(null)
          closeConfirm()
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
        <form
          onSubmit={form.onSubmit((values) => {
            setPendingValues(values)
            openConfirm()
          })}
        >
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

            <Radio.Group label="Target" {...form.getInputProps("audienceType")}>
              <Stack gap="xs" mt="xs">
                <Radio
                  value="all"
                  label="Everyone (broadcast)"
                  description="Delete every refresh token in the database."
                />
                <Radio
                  value="emails"
                  label="Specific users"
                  description="Only revoke tokens for the provided email addresses."
                />
              </Stack>
            </Radio.Group>

            {form.values.audienceType === "emails" && (
              <Textarea
                label="User emails"
                description="Separate addresses with commas or new lines."
                placeholder={"reader@example.com\nteam@example.com"}
                minRows={4}
                autosize
                {...form.getInputProps("recipientEmails")}
              />
            )}

            <Group justify="flex-end">
              <Button type="submit" color="red">
                revoke tokens
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Revoke these tokens?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            You're about to revoke <strong>{audienceSummary}</strong>. This
            signs the affected users out and can't be undone.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={closeConfirm}
              disabled={revokeTokens.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirmRevoke}
              loading={revokeTokens.isPending}
            >
              Revoke {audienceSummary}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
