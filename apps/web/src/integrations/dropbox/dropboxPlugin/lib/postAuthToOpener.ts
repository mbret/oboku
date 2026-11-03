const params = window.location.search
const targetOrigin = window.location.origin

if (window.opener) {
  window.opener.postMessage(
    {
      source: "oauth-redirect",
      params,
    },
    targetOrigin,
  )
  window.close()
}
