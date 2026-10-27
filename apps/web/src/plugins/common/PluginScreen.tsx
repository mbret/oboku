import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { capitalize } from "@mui/material"
import { plugins } from "../configure"
import { type PathParam, useParams } from "react-router"
import { PageContainer } from "../../common/PageContainer"
import type { ROUTES } from "../../navigation/routes"
import { Page } from "../../common/Page"

export const PluginScreen = memo(() => {
  const { type } = useParams<PathParam<typeof ROUTES.PLUGINS_TYPE>>()

  const plugin = plugins.find((plugin) => plugin.type === type)

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title={capitalize(plugin?.name ?? "plugin")} showBack />
      {!!plugin?.InfoScreen && (
        <PageContainer disableGutters>
          <plugin.InfoScreen />
        </PageContainer>
      )}
    </Page>
  )
})
