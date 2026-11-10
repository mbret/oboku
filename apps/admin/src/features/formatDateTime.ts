const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export const formatDateTime = (isoDate: string) =>
  dateTimeFormat.format(new Date(isoDate))
