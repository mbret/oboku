import { ConnectorInfoSection } from "../../connectors/ConnectorInfoSection"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"

export function ServerIntegrationScreen() {
  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="Server" showBack />
      <PageContainer disableGutters>
        <ConnectorInfoSection connectorType="server" maxConnectors={1} />
      </PageContainer>
    </Page>
  )
}
