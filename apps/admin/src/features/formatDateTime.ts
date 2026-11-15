const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export const formatDateTime = (isoDate: string) =>
  dateTimeFormat.format(new Date(isoDate))

const utcDateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeZone: "UTC",
})

export const formatUtcDate = (isoDate: string) =>
  utcDateFormat.format(new Date(isoDate))
