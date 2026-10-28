import { Navigate, type PathParam, useParams } from "react-router"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../navigation/routes"
import { PageContainer } from "../common/PageContainer"
import { Page } from "../common/Page"
import { getIntegrationById, isIntegrationId } from "./configure"

export function IntegrationScreen() {
  const { id } = useParams<PathParam<typeof ROUTES.INTEGRATION_DETAILS>>()

  if (!isIntegrationId(id)) {
    return <Navigate to={ROUTES.INTEGRATIONS} replace />
  }

  const integration = getIntegrationById(id)

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title={integration.name} showBack />
      <PageContainer disableGutters>
        <integration.InfoScreen />
      </PageContainer>
    </Page>
  )
}
