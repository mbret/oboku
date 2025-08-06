import { memo, useState } from "react"
import {
  Link,
  Button,
  Toolbar,
  List,
  ListItemText,
  SvgIcon,
  ListItemIcon,
  Typography,
  useTheme,
  Box,
  ListItemButton,
  IconButton,
  Stack,
} from "@mui/material"
import { Alert } from "@mui/material"
import { DataSourcesAddDrawer } from "../../dataSources/DataSourcesAddDrawer"
import { DataSourceActionsDrawer } from "../../dataSources/DataSourceActionsDrawer"
import {
  Error as ErrorIcon,
  LockRounded,
  MoreVertOutlined,
} from "@mui/icons-material"
import type { DataSourceDocType } from "@oboku/shared"
import { plugins as dataSourcePlugins } from "../../plugins/configure"
import { ObokuErrorCode } from "@oboku/shared"
import { useDataSources } from "../../dataSources/useDataSources"
import { useNavigate, Link as RouterLink } from "react-router"
import { ROUTES } from "../../navigation/routes"
import type { DeepReadonly } from "rxdb"
import { useDataSourceLabel } from "../../dataSources/useDataSourceLabel"

export const DataSourcesListScreen = memo(() => {
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isActionsDrawerOpenWith, setIsActionsDrawerOpenWith] = useState<
    string | undefined
  >(undefined)
  const { data: syncSources } = useDataSources()
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <>
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "auto",
          flexFlow: "column",
        }}
      >
        <Alert severity="info">
          Automatically synchronize books from an external source (eg: Google
          Drive shared folder).{" "}
          <Link href="https://docs.oboku.me" target="__blank">
            Learn more
          </Link>
        </Alert>
        <Toolbar>
          <Button
            style={{
              width: "100%",
            }}
            variant="outlined"
            color="primary"
            onClick={() => setIsDrawerOpened(true)}
          >
            Add a new source
          </Button>
        </Toolbar>
        <List>
          {syncSources?.map((syncSource) => {
            const dataSource = dataSourcePlugins.find(
              (dataSource) => dataSource.type === syncSource.type,
            )

            return (
              <ListItemButton
                key={syncSource._id}
                component={RouterLink}
                to={ROUTES.DATASOURCE_DETAILS.replace(":id", syncSource._id)}
              >
                {dataSource && (
                  <ListItemIcon>
                    <SvgIcon>{dataSource.Icon && <dataSource.Icon />}</SvgIcon>
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={<SyncSourceLabel syncSource={syncSource} />}
                  secondary={
                    syncSource?.syncStatus === "fetching" ? (
                      "Syncing..."
                    ) : syncSource?.lastSyncErrorCode ? (
                      <Box
                        component="span"
                        style={{ flexDirection: "row", display: "flex" }}
                      >
                        <ErrorIcon
                          fontSize="small"
                          style={{ marginRight: theme.spacing(1) }}
                        />
                        <Typography variant="body2" component="span">
                          {`Sync did not succeed`}
                          {syncSource?.lastSyncErrorCode ===
                            ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED &&
                            `. We could not connect to ${dataSource?.name}. If the problem persist try to reload the app`}
                          {syncSource?.lastSyncErrorCode ===
                            ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED &&
                            `. Your datasource seems to have exceeded its allowed access limit`}
                          {syncSource?.lastSyncErrorCode ===
                            ObokuErrorCode.ERROR_DATASOURCE_NETWORK_UNREACHABLE &&
                            `. Our server seems unreachable, make sure you are online to start the synchronization`}
                        </Typography>
                      </Box>
                    ) : syncSource?.lastSyncedAt ? (
                      `Last synced at ${new Date(
                        syncSource?.lastSyncedAt,
                      ).toDateString()}`
                    ) : (
                      "Not synced yet"
                    )
                  }
                />
                <Stack direction="row" alignItems="center" spacing={1}>
                  {syncSource?.isProtected && <LockRounded color="disabled" />}
                  <IconButton
                    edge="end"
                    disableTouchRipple
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsActionsDrawerOpenWith(syncSource._id)
                    }}
                  >
                    <MoreVertOutlined />
                  </IconButton>
                </Stack>
              </ListItemButton>
            )
          })}
        </List>
      </div>
      <DataSourcesAddDrawer
        open={isDrawerOpened}
        onClose={(type) => {
          setIsDrawerOpened(false)
          const dataSource = dataSourcePlugins.find(
            (dataSource) => type === dataSource.type,
          )

          if (dataSource) {
            navigate(
              ROUTES.SYNC_NEW_DATASOURCES.replace(":id", dataSource.type),
            )
          }
        }}
      />
      <DataSourceActionsDrawer
        openWith={isActionsDrawerOpenWith}
        onClose={() => setIsActionsDrawerOpenWith(undefined)}
      />
    </>
  )
})

const SyncSourceLabel = ({
  syncSource,
}: {
  syncSource: DeepReadonly<DataSourceDocType>
}) => {
  const label = useDataSourceLabel(syncSource)

  return <Typography noWrap>{label}</Typography>
}
