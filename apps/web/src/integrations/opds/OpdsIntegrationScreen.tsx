import { CloudSyncRounded, DnsRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { Link } from "react-router"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { ROUTES } from "../../navigation/routes"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"

export function OpdsIntegrationScreen() {
  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="OPDS" showBack />
      <PageContainer disableGutters>
        <PageSection>
          <ListItemButton component={Link} to={ROUTES.OPDS_SERVERS}>
            <ListItemIcon>
              <DnsRounded />
            </ListItemIcon>
            <ListItemText
              primary="OPDS servers"
              secondary="Let KOReader and other reading apps browse your library"
            />
          </ListItemButton>
          <ListItemButton component={Link} to={ROUTES.OPDS_CATALOGS}>
            <ListItemIcon>
              <CloudSyncRounded />
            </ListItemIcon>
            <ListItemText
              primary="OPDS catalogs"
              secondary="Sync the free books of an OPDS catalog, like Komga or Calibre-Web"
            />
          </ListItemButton>
        </PageSection>
      </PageContainer>
    </Page>
  )
}
