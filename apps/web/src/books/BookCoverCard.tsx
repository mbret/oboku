import type React from "react"
import { type FC, memo, type ReactNode } from "react"
import {
  Box,
  type BoxProps,
  Card,
  type CardProps,
  Chip,
  Typography,
  useTheme,
} from "@mui/material"
import {
  CheckOutlined,
  CloudDownloadRounded,
  ErrorRounded,
  LoopRounded,
  NoEncryptionOutlined,
  ThumbDownOutlined,
} from "@mui/icons-material"
import { Cover } from "./Cover"
import { useBook, useIsBookProtected } from "./states"
import { ReadingStateState } from "@oboku/shared"
import { useLink } from "../links/states"
import { DownloadState, useBookDownloadState } from "../download/states"
import { ButtonAsIcon } from "../common/ButtonAsIcon"
import { pluginsByType } from "../plugins/configure"

export const CoverIconBadge = memo(
  ({ children, ...rest }: { children: ReactNode } & BoxProps) => {
    const theme = useTheme()

    return (
      <Box
        display="flex"
        padding={0.3}
        borderRadius="50%"
        bgcolor={theme.alpha(theme.palette.common.white, 0.7)}
        border={`1px solid ${theme.alpha(theme.palette.primary.main, 0.7)}`}
        {...rest}
      >
        {children}
      </Box>
    )
  },
)

export const BookCoverCard: FC<
  {
    bookId: string
    className?: string
    style?: React.CSSProperties
    withDownloadStatus?: boolean
    withBadges: boolean
    showBottomBar?: boolean
    size?: "small" | "large" | "medium"
  } & CardProps
> = memo(
  ({
    bookId,
    className,
    style,
    withDownloadStatus = true,
    withBadges,
    showBottomBar = false,
    size = "small",
    ...rest
  }) => {
    const { data: item } = useBook({ id: bookId })
    const { data: link } = useLink({ id: item?.links?.[0] })
    const linkPlugin = link?.type ? pluginsByType[link?.type] : undefined
    const bookDownloadState = useBookDownloadState(bookId)
    const { data: isBookProtected } = useIsBookProtected(item)
    const theme = useTheme()
    const hasBottomBar =
      showBottomBar &&
      (!!linkPlugin?.Icon ||
        item?.readingStateCurrentState === ReadingStateState.Finished ||
        item?.readingStateCurrentState === ReadingStateState.Reading)

    return (
      <Card
        sx={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          minHeight: 0, // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
          overflow: "hidden",
        }}
        style={style}
        className={className}
        elevation={0}
        {...rest}
      >
        {item && <Cover bookId={item?._id} />}
        {bookDownloadState?.downloadState !== DownloadState.Downloaded && (
          <Box
            bgcolor="white"
            top={0}
            position="absolute"
            width="100%"
            style={{
              opacity: 0.5,
              height:
                bookDownloadState?.downloadState === DownloadState.Downloading
                  ? `${100 - (bookDownloadState?.downloadProgress || 0)}%`
                  : `100%`,
            }}
          />
        )}
        <Box
          sx={{
            position: "absolute",
            height: "100%",
            width: "100%",
            top: 0,
            display: "flex",
            padding: (theme) => theme.spacing(0.5),
            flexDirection: "column",
            alignItems: "center",
          }}
          gap={1}
        >
          {withBadges && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexDirection="row"
              width="100%"
            >
              <Box gap={1} flexDirection="row" display="flex">
                {isBookProtected && (
                  <CoverIconBadge>
                    <NoEncryptionOutlined color="primary" fontSize={size} />
                  </CoverIconBadge>
                )}
                {item?.isNotInterested && (
                  <CoverIconBadge>
                    <ThumbDownOutlined color="primary" fontSize={size} />
                  </CoverIconBadge>
                )}
              </Box>
            </Box>
          )}
          {withBadges && item?.metadataUpdateStatus === "fetching" && (
            <Chip
              color="primary"
              size="small"
              icon={
                <LoopRounded color="primary" className="oboku-infinite-spin" />
              }
              label="metadata..."
            />
          )}
          {withBadges &&
            item?.metadataUpdateStatus !== "fetching" &&
            !!item?.lastMetadataUpdateError && (
              <Chip
                color="primary"
                size="small"
                icon={<ErrorRounded color="primary" />}
                label="metadata"
              />
            )}

          {withDownloadStatus &&
            bookDownloadState?.downloadState === DownloadState.None && (
              <ButtonAsIcon
                variant="contained"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <CloudDownloadRounded fontSize={size} />
              </ButtonAsIcon>
            )}
          {withDownloadStatus &&
            bookDownloadState?.downloadState === DownloadState.Downloading && (
              <Box
                sx={{
                  transform: "translate(-50%, -50%)",
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                }}
              >
                <Chip color="primary" size="small" label="downloading..." />
              </Box>
            )}
        </Box>
        {hasBottomBar && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            minHeight={theme.spacing(4)}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            p={0.5}
            boxSizing="border-box"
            bgcolor={
              theme.palette.mode === "dark"
                ? theme.alpha(theme.palette.common.black, 0.5)
                : theme.alpha(theme.palette.common.white, 0.5)
            }
            sx={{
              lineHeight: 0,
              backdropFilter: "blur(8px)",
            }}
          >
            <Box display="flex" alignItems="center">
              {linkPlugin?.Icon && (
                <linkPlugin.Icon fontSize="medium" sx={{ display: "block" }} />
              )}
            </Box>
            <Box display="flex" alignItems="center">
              {item?.readingStateCurrentState === ReadingStateState.Reading && (
                <Typography variant="body2" fontWeight="bold">
                  {Math.floor(
                    (item?.readingStateCurrentBookmarkProgressPercent || 0) *
                      100,
                  ) || 1}
                  %
                </Typography>
              )}
              {item?.readingStateCurrentState ===
                ReadingStateState.Finished && (
                <CheckOutlined fontSize="medium" />
              )}
            </Box>
          </Box>
        )}
      </Card>
    )
  },
)
