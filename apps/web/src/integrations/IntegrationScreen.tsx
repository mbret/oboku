import { type PathParam, useParams } from "react-router"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import type { ROUTES } from "../navigation/routes"
import { PageContainer } from "../common/PageContainer"
import { Page } from "../common/Page"
import { integrations } from "./configure"

export function IntegrationScreen() {
  const { id } = useParams<PathParam<typeof ROUTES.INTEGRATION_DETAILS>>()

  const integration = integrations.find((integration) => integration.id === id)

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title={integration?.name ?? "Integration"} showBack />
      {!!integration && (
        <PageContainer disableGutters>
          <integration.InfoScreen />
        </PageContainer>
      )}
    </Page>
  )
}
