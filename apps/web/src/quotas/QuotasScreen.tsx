import { GroupsRounded, PersonRounded } from "@mui/icons-material"
import {
  Link,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material"
import type { ReactNode } from "react"
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

function QuotaUsageListItem({
  icon,
  primary,
  usedBytes,
  quotaBytes,
  caption,
}: {
  icon: ReactNode
  primary: string
  usedBytes: number
  quotaBytes: number
  caption?: string
}) {
  return (
    <ListItem>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText
        primary={primary}
        disableTypography
        secondary={
          <>
            <UsageProgress usedBytes={usedBytes} totalBytes={quotaBytes} />
            {caption && (
              <Typography variant="body2" color="textSecondary">
                {caption}
              </Typography>
            )}
          </>
        }
      />
    </ListItem>
  )
}

export function QuotasScreen() {
  const quotaQuery = useProxiedDownloadQuota()
  const { data: quota, isLoading, isError } = quotaQuery
  const isUnavailable = isQueryUnavailable(quotaQuery)

  return (
    <Page>
      <TopBarNavigation title="Quotas" showBack />
      <PageContainer disableGutters>
        <PageSection title="Download quotas">
          <ListItem>
            <ListItemText
              secondary={
                <>
                  Books your reading apps download from your{" "}
                  <Link component={RouterLink} to={ROUTES.OPDS_SERVERS}>
                    OPDS servers
                  </Link>{" "}
                  pass through oboku's server, and so do books from WebDAV and
                  OPDS connectors and web addresses that use it as a proxy. They
                  count towards your monthly quota and towards the quota of all
                  users.
                </>
              }
            />
          </ListItem>
          {isLoading && (
            <ListItem>
              <LoadingAlert subject="download quotas" />
            </ListItem>
          )}
          {isError && (
            <ListItem>
              <FetchErrorAlert>
                Something went wrong while loading the download quotas. Please
                try again later.
              </FetchErrorAlert>
            </ListItem>
          )}
          {isUnavailable && (
            <ListItem>
              <UnavailableAlert>
                The download quotas can't be loaded right now.
              </UnavailableAlert>
            </ListItem>
          )}
          {quota && (
            <>
              <QuotaUsageListItem
                icon={<PersonRounded />}
                primary="You"
                usedBytes={quota.userUsedBytes}
                quotaBytes={quota.userQuotaBytes}
                caption="You can download up to this amount while the quota of all users lasts."
              />
              <QuotaUsageListItem
                icon={<GroupsRounded />}
                primary="All users"
                usedBytes={quota.usedBytes}
                quotaBytes={quota.quotaBytes}
              />
              <ListItem>
                <ListItemText
                  secondary={`Both quotas start over on ${resetDateFormatter.format(new Date(quota.resetsAt))}.`}
                />
              </ListItem>
            </>
          )}
        </PageSection>
      </PageContainer>
    </Page>
  )
}
