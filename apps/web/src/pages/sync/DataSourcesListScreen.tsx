import { memo, useState } from "react"
import {
  Link,
  Button,
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
import { type DataSourceDocType, links } from "@oboku/shared"
import { plugins as dataSourcePlugins } from "../../plugins/configure"
import { errorToMessage } from "../../errors/ErrorMessage"
import { useDataSources } from "../../dataSources/useDataSources"
import { generatePath, useNavigate, Link as RouterLink } from "react-router"
import { ROUTES } from "../../navigation/routes"
import type { DeepReadonly } from "rxdb"
import { useDataSourceLabel } from "../../dataSources/useDataSourceLabel"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"

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
        <PageContainer>
          <Stack
            sx={{
              gap: 1,
              mt: 2,
              mb: 1,
            }}
          >
            <Alert severity="info">
              Automatically synchronize books from an external source (eg:
              Google Drive shared folder).{" "}
              <Link href={links.documentation} target="_blank">
                Learn more
              </Link>
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setIsDrawerOpened(true)}
            >
              Add a new source
            </Button>
          </Stack>
        </PageContainer>
        <PageContainer disableGutters>
          <PageSection>
            {syncSources?.map((syncSource) => {
              const dataSource = dataSourcePlugins.find(
                (dataSource) => dataSource.type === syncSource.type,
              )

              return (
                <ListItemButton
                  key={syncSource._id}
                  component={RouterLink}
                  to={generatePath(ROUTES.DATASOURCE_DETAILS, {
                    id: syncSource._id,
                  })}
                >
                  {dataSource && (
                    <ListItemIcon>
                      <SvgIcon>
                        {dataSource.Icon && <dataSource.Icon />}
                      </SvgIcon>
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
                            {`Sync did not succeed. ${errorToMessage(syncSource.lastSyncErrorCode)}`}
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
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    {syncSource?.isProtected && (
                      <LockRounded color="disabled" />
                    )}
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
          </PageSection>
        </PageContainer>
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
              generatePath(ROUTES.SYNC_NEW_DATASOURCES, {
                type: dataSource.type,
              }),
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
