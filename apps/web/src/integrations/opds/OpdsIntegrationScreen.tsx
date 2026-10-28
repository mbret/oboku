import { ConnectorInfoSection } from "../../connectors/ConnectorInfoSection"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"

export function OpdsIntegrationScreen() {
  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="OPDS" showBack />
      <PageContainer disableGutters>
        <ConnectorInfoSection connectorType="opds" />
      </PageContainer>
    </Page>
  )
}
