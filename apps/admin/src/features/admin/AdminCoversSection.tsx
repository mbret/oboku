import { Button, Code, Group, List, Paper, Stack, Text } from "@mantine/core"
import { useCoverCleanupStats } from "../useCoverCleanupStats"
import { useDeleteAllCovers } from "../useDeleteAllCovers"

const confirmDeleteAllCovers = () =>
  window.confirm("Delete all stored covers?\n\nThis cannot be undone.")

const formatBytes = (value: number) => {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export const AdminCoversSection = () => {
  const coverCleanupStats = useCoverCleanupStats({
    enabled: true,
  })
  const {
    mutate: deleteAllCovers,
    data: deleteAllCoversResult,
    isPending: isDeleteAllCoversPending,
    error: deleteAllCoversError,
  } = useDeleteAllCovers()

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Covers
          </Text>
          <Text size="sm" c="dimmed">
            Inspect stored covers, see where they are stored, and remove all
            covers if needed.
          </Text>
        </div>
        <Group gap="xs">
          <Button
            variant="light"
            onClick={() => coverCleanupStats.refetch()}
            loading={coverCleanupStats.isFetching}
          >
            refresh
          </Button>
          <Button
            color="red"
            disabled={
              !coverCleanupStats.data?.canDeleteAllCovers ||
              (coverCleanupStats.data?.storedCovers ?? 0) < 1
            }
            loading={isDeleteAllCoversPending}
            onClick={() => {
              if (!confirmDeleteAllCovers()) {
                return
              }

              deleteAllCovers()
            }}
          >
            delete all covers
          </Button>
        </Group>
      </Group>
      {coverCleanupStats.isLoading && (
        <Text size="sm" c="dimmed" mt="sm">
          Scanning covers…
        </Text>
      )}
      {coverCleanupStats.error && (
        <Text size="sm" c="red" mt="sm">
          Error: {coverCleanupStats.error.message}
        </Text>
      )}
      {coverCleanupStats.data && (
        <Stack gap="sm" mt="sm">
          <List size="sm" spacing="xs">
            <List.Item>
              Current storage path:{" "}
              <Code>{coverCleanupStats.data.storageLocation}</Code>
            </List.Item>
            {coverCleanupStats.data.storageStrategy === "fs" && (
              <>
                <List.Item>
                  Global storage used:{" "}
                  {formatBytes(coverCleanupStats.data.storedSizeInBytes ?? 0)}
                </List.Item>
                <List.Item>
                  Number of covers: {coverCleanupStats.data.storedCovers ?? 0}
                </List.Item>
              </>
            )}
          </List>
          {coverCleanupStats.data.storageStrategy === "s3" && (
            <Text size="sm" c="dimmed">
              Covers are stored in S3. Check S3 directly for storage usage and
              object counts.
            </Text>
          )}
          {!coverCleanupStats.data.canDeleteAllCovers && (
            <Text size="sm" c="dimmed">
              Delete-all is only available when covers are stored on the local
              filesystem.
            </Text>
          )}
          {deleteAllCoversResult && (
            <Text size="sm" c="dimmed">
              Last deletion: deleted {deleteAllCoversResult.deletedCovers}{" "}
              cover(s), reclaimed{" "}
              {formatBytes(deleteAllCoversResult.deletedSizeInBytes)}.
              {deleteAllCoversResult.failedCovers > 0 &&
                ` ${deleteAllCoversResult.failedCovers} deletion(s) failed.`}
            </Text>
          )}
          {deleteAllCoversError && (
            <Text size="sm" c="red">
              Error: {deleteAllCoversError.message}
            </Text>
          )}
        </Stack>
      )}
    </Paper>
  )
}
