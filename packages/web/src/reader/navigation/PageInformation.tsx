import React, { FC } from "react"
import { Typography, useTheme } from "@mui/material"
import { readerSignal, usePagination } from "../states"
import { useObserve, useSignalValue } from "reactjrx"
import { useCurrentPage } from "../pagination/useCurrentPage"
import { useTotalPages } from "../pagination/useTotalPages"

export const PageInformation: FC<{
  style: React.CSSProperties
  bookId: string
}> = ({ style, bookId }) => {
  const theme = useTheme()
  const currentPage = useCurrentPage({ bookId }) || 0
  const reader = useSignalValue(readerSignal)
  const { manifest } = useObserve(() => reader?.context.state$, [reader]) || {}
  const { renditionLayout } = manifest ?? {}
  const {
    data: { percentageEstimateOfBook, beginChapterInfo: chapterInfo } = {}
  } = usePagination()
  const roundedProgress = Math.floor((percentageEstimateOfBook || 0) * 100)
  const displayableProgress = roundedProgress > 0 ? roundedProgress : 1
  const currentPageToDisplay = currentPage + 1
  const totalPagesToDisplay = useTotalPages({ bookId }) || 1

  const buildTitleChain = (
    subChapterInfo: NonNullable<typeof chapterInfo>
  ): string => {
    if (subChapterInfo?.subChapter) {
      return `${subChapterInfo.title} / ${buildTitleChain(
        subChapterInfo.subChapter
      )}`
    }
    return subChapterInfo?.title || ""
  }

  return (
    <div
      style={{
        ...style,
        // minHeight: 30,
        ...(renditionLayout === "reflowable" &&
          {
            // minHeight: 50,
          }),
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <>
        {renditionLayout !== "reflowable" ? (
          <div
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography
              variant="body2"
              noWrap
              style={{ width: "90%", textAlign: "center" }}
            >
              {chapterInfo?.title}
            </Typography>
            <Typography
              style={{ fontWeight: theme.typography.fontWeightMedium }}
            >
              page {currentPageToDisplay || 0} of {totalPagesToDisplay}
            </Typography>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography
              variant="body2"
              noWrap
              style={{ width: "90%", textAlign: "center" }}
            >
              {chapterInfo && buildTitleChain(chapterInfo)}
            </Typography>
            <div style={{ display: "flex", marginTop: theme.spacing(1) }}>
              {totalPagesToDisplay > 1 && (
                <Typography
                  variant="body2"
                  style={{ marginRight: theme.spacing(2) }}
                >
                  page {currentPageToDisplay} of {totalPagesToDisplay}
                </Typography>
              )}
              {percentageEstimateOfBook !== undefined && (
                <Typography
                  style={{ fontWeight: theme.typography.fontWeightMedium }}
                  variant="body2"
                >
                  ({displayableProgress} %)
                </Typography>
              )}
            </div>
          </div>
        )}
      </>
    </div>
  )
}
