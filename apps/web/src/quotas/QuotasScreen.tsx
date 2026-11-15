import { DownloadRounded } from "@mui/icons-material"
import {
  Link,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material"
import { Link as RouterLink } from "react-router"
import { FetchErrorAlert } from "../common/alerts/FetchErrorAlert"
import { LoadingAlert } from "../common/alerts/LoadingAlert"
import { UnavailableAlert } from "../common/alerts/UnavailableAlert"
import { Page } from "../common/Page"
import { PageContainer } from "../common/PageContainer"
import { PageSection } from "../common/PageSection"
import { UsageProgress } from "../common/UsageProgress"
import { ROUTES } from "../navigation/routes"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { isQueryUnavailable } from "../queries/isQueryUnavailable"
import { useProxiedDownloadQuota } from "./useProxiedDownloadQuota"

const resetDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeZone: "UTC",
})

export function QuotasScreen() {
  const quotaQuery = useProxiedDownloadQuota()
  const { data: quota, isLoading, isError } = quotaQuery
  const isUnavailable = isQueryUnavailable(quotaQuery)

  return (
    <Page>
      <TopBarNavigation title="Quotas" showBack />
      <PageContainer disableGutters>
        <PageSection title="Download quota">
          <ListItem>
            <ListItemText
              secondary={
                <>
                  Books your reading apps download from your{" "}
                  <Link component={RouterLink} to={ROUTES.OPDS_SERVERS}>
                    OPDS servers
                  </Link>{" "}
                  pass through oboku's server and count towards this monthly
                  quota, which all users share.
                </>
              }
            />
          </ListItem>
          {isLoading && (
            <ListItem>
              <LoadingAlert subject="download quota" />
            </ListItem>
          )}
          {isError && (
            <ListItem>
              <FetchErrorAlert>
                Something went wrong while loading the download quota. Please
                try again later.
              </FetchErrorAlert>
            </ListItem>
          )}
          {isUnavailable && (
            <ListItem>
              <UnavailableAlert>
                The download quota can't be loaded right now.
              </UnavailableAlert>
            </ListItem>
          )}
          {quota && (
            <ListItem>
              <ListItemIcon>
                <DownloadRounded />
              </ListItemIcon>
              <ListItemText
                primary="Used this month"
                disableTypography
                secondary={
                  <>
                    <UsageProgress
                      usedBytes={quota.usedBytes}
                      totalBytes={quota.quotaBytes}
                    />
                    <Typography variant="body2" color="textSecondary">
                      {`The quota starts over on ${resetDateFormatter.format(new Date(quota.resetsAt))}.`}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          )}
        </PageSection>
      </PageContainer>
    </Page>
  )
}
