import { Alert, Box, Chip, Stack, Typography } from "@mui/material"
import { format } from "date-fns"
import { Fragment } from "react/jsx-runtime"
import { getRxModelLabelFromValue, getRxModelIconFromValue } from "./helpers"
import { useSyncReports } from "./useSyncReports"
import { SkeletonLoader } from "./SkeletonLoader"
import { ReportSummary } from "./ReportSummary"
import { memo } from "react"

export const DataSourcesReportsScreen = memo(() => {
  const { data, isLoading } = useSyncReports()

  return (
    <Stack overflow="auto">
      {isLoading ? (
        <SkeletonLoader />
      ) : !data?.length ? (
        <Alert severity="info">
          You don't have any reports yet. They will appears after you start a
          sync.
        </Alert>
      ) : (
        <Stack py={2} px={1} gap={2}>
          {data?.map((entry, index) => (
            <Stack key={index}>
              <Stack direction="row" gap={1} justifyItems="center">
                <Chip size="small" label="sync" variant="filled" />
                <Typography variant="body1" component="h2" fontWeight="bold">
                  {format(entry.createdAt, "Pp")}
                </Typography>
                <Box>
                  {entry.report.state === "error" && (
                    <Chip
                      size="small"
                      label="error"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  {entry.report.state === "success" && (
                    <Chip
                      size="small"
                      label="success"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Stack>
              <Stack mt={1} gap={1} pl={1}>
                <ReportSummary entry={entry} />

                {!!entry.report.report.length && (
                  <Stack>
                    {entry.report.report.map(
                      (
                        {
                          rx_model,
                          linkedTo,
                          label,
                          id,
                          added,
                          ...reportEntry
                        },
                        index,
                      ) => {
                        const linkedToBooks =
                          linkedTo?.filter(
                            (item) => item.rx_model === "book",
                          ) ?? []
                        const linkedToTags =
                          linkedTo?.filter((item) => item.rx_model === "tag") ??
                          []
                        const linkedToCollections =
                          linkedTo?.filter(
                            (item) => item.rx_model === "obokucollection",
                          ) ?? []
                        const ModelIcon = getRxModelIconFromValue(rx_model)

                        const icon = (
                          <ModelIcon
                            fontSize="small"
                            style={{ verticalAlign: "middle" }}
                            color="action"
                          />
                        )

                        return (
                          <Fragment key={index}>
                            {added && (
                              <Box>
                                {icon}{" "}
                                <Typography variant="caption" component="span">
                                  {getRxModelLabelFromValue(rx_model)}{" "}
                                  <b>{label ?? id}</b> created
                                </Typography>
                              </Box>
                            )}
                            {rx_model === `tag` && !!linkedToBooks?.length && (
                              <Box>
                                {icon}{" "}
                                <Typography variant="caption" component="span">
                                  Tag <b>{label ?? id}</b> associated with books{" "}
                                  {linkedToBooks
                                    .map(({ id, label }) => `"${label ?? id}"`)
                                    .join(`, `)}
                                </Typography>
                              </Box>
                            )}
                            {rx_model === `book` && !!linkedToTags?.length && (
                              <Box>
                                {icon}{" "}
                                <Typography variant="caption" component="span">
                                  Book <b>{label ?? id}</b> associated with tags{" "}
                                  {linkedToTags
                                    .map(({ id, label }) => `"${label ?? id}"`)
                                    .join(`, `)}
                                </Typography>
                              </Box>
                            )}
                            {rx_model === `book` &&
                              reportEntry.fetchedMetadata && (
                                <Box>
                                  {icon}{" "}
                                  <Typography
                                    variant="caption"
                                    component="span"
                                  >
                                    Book <b>{label ?? id}</b> had metadata
                                    refetch
                                  </Typography>
                                </Box>
                              )}
                            {rx_model === `obokucollection` &&
                              !!linkedToBooks?.length && (
                                <Box>
                                  {icon}{" "}
                                  <Typography
                                    variant="caption"
                                    component="span"
                                  >
                                    Collection <b>{label ?? id}</b> associated
                                    with books{" "}
                                    {linkedToBooks
                                      .map(
                                        ({ id, label }) => `"${label ?? id}"`,
                                      )
                                      .join(`, `)}
                                  </Typography>
                                </Box>
                              )}
                            {rx_model === `book` &&
                              !!linkedToCollections?.length && (
                                <Box>
                                  {icon}{" "}
                                  <Typography
                                    variant="caption"
                                    component="span"
                                  >
                                    Book <b>{label ?? id}</b> associated with
                                    collections{" "}
                                    {linkedToCollections
                                      .map(
                                        ({ id, label }) => `"${label ?? id}"`,
                                      )
                                      .join(`, `)}
                                  </Typography>
                                </Box>
                              )}
                          </Fragment>
                        )
                      },
                    )}
                  </Stack>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  )
})
