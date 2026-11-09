import { ConnectorInfoSection } from "../../../connectors/ConnectorInfoSection"
import { Page } from "../../../common/Page"
import { PageContainer } from "../../../common/PageContainer"
import { TopBarNavigation } from "../../../navigation/TopBarNavigation"

export function OpdsCatalogsScreen() {
  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="OPDS catalogs" showBack />
      <PageContainer disableGutters>
        <ConnectorInfoSection connectorType="opds" />
      </PageContainer>
    </Page>
  )
}
