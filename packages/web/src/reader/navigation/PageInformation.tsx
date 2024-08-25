import { memo } from "react"
import { Stack, StackProps, Typography } from "@mui/material"
import { usePagination } from "../states"
import { useCurrentPages } from "../pagination/useCurrentPages"
import { useTotalPages } from "../pagination/useTotalPages"

export const PageInformation = memo(
  ({ bookId, ...rest }: { bookId: string } & StackProps) => {
    const [beginPage, endPage] = useCurrentPages({ bookId }) || 0
    const {
      data: { percentageEstimateOfBook, beginChapterInfo: chapterInfo } = {}
    } = usePagination()
    const roundedProgress = Math.floor((percentageEstimateOfBook || 0) * 100)
    const displayableProgress = roundedProgress > 0 ? roundedProgress : 1
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
      <Stack width="100%" justifyContent="center" alignItems="center" {...rest}>
        <Typography
          variant="body2"
          noWrap
          style={{ width: "90%", textAlign: "center" }}
        >
          {chapterInfo && buildTitleChain(chapterInfo)}
        </Typography>
        <Stack direction="row" gap={1} alignItems="center">
          <Typography>
            {endPage !== undefined
              ? `page ${beginPage} - ${endPage} of ${totalPagesToDisplay}`
              : `page ${beginPage} of ${totalPagesToDisplay}`}
          </Typography>
          <Typography variant="body2">({displayableProgress} %)</Typography>
        </Stack>
      </Stack>
    )
  }
)
