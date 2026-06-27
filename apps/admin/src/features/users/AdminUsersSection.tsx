import { useMemo, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import type { AdminUserSummary } from "@oboku/shared"
import {
  AllCommunityModule,
  type ColDef,
  ModuleRegistry,
} from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import { useAdminUsers } from "./useAdminUsers"

ModuleRegistry.registerModules([AllCommunityModule])

export const AdminUsersSection = () => {
  const usersQuery = useAdminUsers()
  const [quickFilter, setQuickFilter] = useState("")

  const columnDefs = useMemo<ColDef<AdminUserSummary>[]>(
    () => [
      { field: "id", headerName: "ID", maxWidth: 100, sort: "asc" },
      { field: "username", headerName: "Username", flex: 1, minWidth: 160 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      {
        field: "emailVerified",
        headerName: "Email verified",
        maxWidth: 160,
        cellRenderer: (params: { value: boolean }) => (
          <Badge color={params.value ? "green" : "gray"} variant="light">
            {params.value ? "verified" : "unverified"}
          </Badge>
        ),
      },
    ],
    [],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    [],
  )

  return (
    <Stack gap="md">
      <div>
        <Title order={3} mb="xs">
          Users
        </Title>
        <Text size="sm" c="dimmed">
          All registered users.
        </Text>
      </div>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-end">
            <TextInput
              label="Search"
              placeholder="Filter by username, email…"
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.currentTarget.value)}
              w={280}
            />
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                {usersQuery.data?.length ?? 0} user
                {usersQuery.data?.length === 1 ? "" : "s"}
              </Text>
              <Button
                variant="light"
                onClick={() => usersQuery.refetch()}
                loading={usersQuery.isFetching}
              >
                refresh
              </Button>
            </Group>
          </Group>

          {usersQuery.error && (
            <Alert color="red" title="Could not load users">
              {usersQuery.error.message}
            </Alert>
          )}

          <div style={{ height: 600, width: "100%" }}>
            <AgGridReact<AdminUserSummary>
              rowData={usersQuery.data ?? []}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              enableCellTextSelection
              ensureDomOrder
              quickFilterText={quickFilter}
              loading={usersQuery.isLoading}
              pagination
              paginationPageSize={50}
              paginationPageSizeSelector={[25, 50, 100]}
            />
          </div>
        </Stack>
      </Paper>
    </Stack>
  )
}
