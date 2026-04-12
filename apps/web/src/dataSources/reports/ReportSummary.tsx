import { Stack, Typography } from "@mui/material"
import { memo } from "react"
import { formatReportDuration, getRxModelLabelFromValue } from "./helpers"
import type { useSyncReports } from "./useSyncReports"

export const ReportSummary = memo(function ReportSummary({
  entry,
}: {
  entry: NonNullable<ReturnType<typeof useSyncReports>["data"]>[number]
}) {
  return (
    <Stack gap={1}>
      <Typography variant="body2">
        <b>Duration:</b> {formatReportDuration(entry.createdAt, entry.endedAt)}
      </Typography>

      <Stack>
        {(["obokucollection", "book", "tag", "link"] as const).map(
          (rxModel) => (
            <Stack key={rxModel}>
              {!!entry[rxModel].added && (
                <Typography variant="body2">
                  {entry[rxModel].added} {getRxModelLabelFromValue(rxModel)}(s)
                  created
                </Typography>
              )}
              {!!entry[rxModel].deleted && (
                <Typography variant="body2">
                  {entry[rxModel].deleted} {getRxModelLabelFromValue(rxModel)}
                  (s) deleted
                </Typography>
              )}
              {!!entry[rxModel].updated && (
                <Typography variant="body2">
                  {entry[rxModel].updated} {getRxModelLabelFromValue(rxModel)}
                  (s) updated
                </Typography>
              )}
              {!!entry[rxModel].fetchedMetadata && (
                <Typography variant="body2">
                  {entry[rxModel].fetchedMetadata}{" "}
                  {getRxModelLabelFromValue(rxModel)}
                  (s) with metadata fetched
                </Typography>
              )}
            </Stack>
          ),
        )}
      </Stack>
    </Stack>
  )
})
