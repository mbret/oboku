import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { capitalize, Stack } from "@mui/material"
import { plugins } from "../configure"
import { type PathParam, useParams } from "react-router"
import { PageContainer } from "../../common/PageContainer"
import type { ROUTES } from "../../navigation/routes"

export const PluginScreen = memo(() => {
  const { type } = useParams<PathParam<typeof ROUTES.PLUGINS_TYPE>>()

  const plugin = plugins.find((plugin) => plugin.type === type)

  return (
    <Stack
      sx={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <TopBarNavigation title={capitalize(plugin?.name ?? "plugin")} showBack />
      {!!plugin?.InfoScreen && (
        <PageContainer disableGutters>
          <plugin.InfoScreen />
        </PageContainer>
      )}
    </Stack>
  )
})
