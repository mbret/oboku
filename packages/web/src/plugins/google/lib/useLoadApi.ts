import { useEffect, useState } from "react"

const ID = "oboku-google-api-script"
const GSI_ID = "oboku-google-gsi-script"

export const useLoadApi = () => {
  const [api, setApi] = useState<typeof gapi | undefined>()
  const [gsi, setGsi] = useState<typeof google | undefined>()

  useEffect(() => {
    if (document.getElementById(ID)) return

    const script = document.createElement("script")
    script.id = ID
    script.src = "https://apis.google.com/js/api.js"
    script.async = true
    script.defer = true
    script.onload = () => {
      setApi(window.gapi)
    }
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (document.getElementById(GSI_ID)) return

    const script = document.createElement("script")
    script.id = GSI_ID
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      setGsi(window.google)
    }
    document.body.appendChild(script)
  }, [])

  return { api, gsi }
}
