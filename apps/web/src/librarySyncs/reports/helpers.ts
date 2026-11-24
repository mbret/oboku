import {
  CloudRounded,
  FolderRounded,
  LocalOfferRounded,
  MenuBookRounded,
} from "@mui/icons-material"
import { createDurationFromSeconds } from "../../common/date/duration"

const reportDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
})

const reportDurationFormatter = new Intl.DurationFormat(undefined, {
  style: "short",
})

const reportZeroSecondsFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "second",
  unitDisplay: "short",
})

export const getRxModelLabelFromValue = (
  rxModel: "obokucollection" | "book" | "tag" | "link" | "datasource",
) => {
  switch (rxModel) {
    case "obokucollection":
      return "collection"
    case "tag":
      return "tag"
    case "datasource":
      return "datasource"
    case "link":
      return "link"
    default:
      return "book"
  }
}

export const getRxModelIconFromValue = (
  rxModel: "obokucollection" | "book" | "tag" | "link" | "datasource",
) => {
  switch (rxModel) {
    case "obokucollection":
      return FolderRounded
    case "tag":
      return LocalOfferRounded
    case "datasource":
      return CloudRounded
    case "link":
      return LocalOfferRounded
    default:
      return MenuBookRounded
  }
}

export const formatReportDateTime = (date: Date) =>
  reportDateTimeFormatter.format(date)

export const formatReportDuration = (start: Date, end: Date) => {
  const totalSeconds = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 1000),
  )

  if (totalSeconds === 0) {
    return reportZeroSecondsFormatter.format(0)
  }

  return reportDurationFormatter.format(createDurationFromSeconds(totalSeconds))
}
