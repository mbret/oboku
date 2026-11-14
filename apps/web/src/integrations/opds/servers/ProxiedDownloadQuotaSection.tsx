import { ListItem, ListItemText } from "@mui/material"
import { formatBytes } from "@oboku/shared"
import { FetchErrorAlert } from "../../../common/alerts/FetchErrorAlert"
import { LoadingAlert } from "../../../common/alerts/LoadingAlert"
import { PageSection } from "../../../common/PageSection"
import { useProxiedDownloadQuota } from "./useProxiedDownloadQuota"

const resetDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeZone: "UTC",
})

export function ProxiedDownloadQuotaSection() {
  const { data: quota, isLoading, isError } = useProxiedDownloadQuota()

  return (
    <PageSection title="Download quota">
      {isLoading && (
        <ListItem>
          <LoadingAlert subject="download quota" />
        </ListItem>
      )}
      {isError && (
        <ListItem>
          <FetchErrorAlert subject="download quota" />
        </ListItem>
      )}
      {quota && (
        <ListItem>
          <ListItemText
            primary={`${formatBytes(quota.usedBytes)} of ${formatBytes(quota.quotaBytes)} used this month`}
            secondary={`Every user's reading app downloads count. The quota starts over on ${resetDateFormatter.format(new Date(quota.resetsAt))}.`}
          />
        </ListItem>
      )}
    </PageSection>
  )
}
