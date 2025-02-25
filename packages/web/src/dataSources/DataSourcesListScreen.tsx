import { useState } from "react"
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
} from "@mui/material"
import { Alert } from "@mui/material"
import { DataSourcesAddDrawer } from "./DataSourcesAddDrawer"
import { DataSourcesActionsDrawer } from "./DataSourcesActionsDrawer"
import { Error, LockRounded } from "@mui/icons-material"
import { DataSourceDocType } from "@oboku/shared"
import { plugins as dataSourcePlugins } from "../plugins/configure"
import { AddDataSource } from "./AddDataSource"
import { ObokuErrorCode } from "@oboku/shared"
import { useDataSources } from "./useDataSources"
import { ObokuPlugin } from "../plugins/types"

export const DataSourcesListScreen = () => {
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isAddDataSourceOpenedWith, setIsAddDataSourceOpenedWith] = useState<
    ObokuPlugin | undefined
  >(undefined)
  const [isActionsDrawerOpenWith, setIsActionsDrawerOpenWith] = useState<
    string | undefined
  >(undefined)
  const { data: syncSources } = useDataSources()
  const theme = useTheme()

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
                onClick={() => setIsActionsDrawerOpenWith(syncSource._id)}
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
                        <Error
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
                {syncSource?.isProtected && <LockRounded color="primary" />}
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
            setIsAddDataSourceOpenedWith(dataSource)
          }
        }}
      />
      {isActionsDrawerOpenWith && (
        <DataSourcesActionsDrawer
          openWith={isActionsDrawerOpenWith}
          onClose={() => setIsActionsDrawerOpenWith(undefined)}
        />
      )}
      {isAddDataSourceOpenedWith && (
        <AddDataSource
          onClose={() => setIsAddDataSourceOpenedWith(undefined)}
          openWith={isAddDataSourceOpenedWith}
        />
      )}
    </>
  )
}

const SyncSourceLabel = ({ syncSource }: { syncSource: DataSourceDocType }) => {
  const dataSource = dataSourcePlugins.find(
    (dataSource) => dataSource.type === syncSource.type,
  )

  const { name = dataSource?.name } =
    (dataSource?.useSyncSourceInfo &&
      dataSource.useSyncSourceInfo(syncSource)) ||
    {}

  return <Typography noWrap>{name}</Typography>
}
