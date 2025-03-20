export const getCoverIdFromUrl = (url: URL) => {
  const pathname = url.pathname
  const pathParts = pathname.split(`/`)
  const id = pathParts[pathParts.length - 1]

  return id
}

export const getMetadataFromRequest = (request: Request) => {
  const coverId = request.headers.get(`oboku-sw-cover-id`) || `-1`
  const coverTimeCached = parseInt(
    request.headers.get(`oboku-sw-time-cached`) || "0",
  )

  return {
    coverId,
    coverTimeCached,
  }
}

export const hasAnotherMoreRecentCoverForThisRequest = (
  request: Request,
  requests: readonly Request[],
) => {
  const { coverId, coverTimeCached } = getMetadataFromRequest(request)

  return requests.find((key) => {
    const { coverId: itemCoverId, coverTimeCached: existingCoverTimeCached } =
      getMetadataFromRequest(key)

    return (
      key.url !== request.url &&
      itemCoverId === coverId &&
      existingCoverTimeCached > coverTimeCached
    )
  })
}
