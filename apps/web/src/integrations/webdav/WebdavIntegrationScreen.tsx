import { ConnectorInfoSection } from "../../connectors/ConnectorInfoSection"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"

export function WebdavIntegrationScreen() {
  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="WebDAV" showBack />
      <PageContainer disableGutters>
        <ConnectorInfoSection connectorType="webdav" />
      </PageContainer>
    </Page>
  )
}
