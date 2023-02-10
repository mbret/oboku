export const isPopupClosedError = (error: unknown) => {
  return (
    error &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "popup_closed"
  )
}
