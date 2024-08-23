/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import { FC, memo, useEffect, useRef } from "react"
import { Report } from "../../debug/report.shared"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { useAddBook } from "../../books/helpers"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import useIsMounted from "./lib/useIsMounted"
import { getToken } from "./lib/getToken"

const baseUrl = "https://onedrive.live.com/picker"

export const UploadBook: FC<{
  onClose: () => void
}> = memo(({ onClose }) => {
  const [addBook] = useAddBook()
  const isMounted = useIsMounted()
  const isOpened = useRef(false)
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER
  )

  useEffect(() => {
    if (isOpened.current) return
    ;(async () => {
      // create a new window. The Picker's recommended maximum size is 1080x680, but it can scale down to
      // a minimum size of 250x230 for very small screens or very large zoom.
      const win = window.open("", "Picker", "width=1080,height=680")

      // we need to get an authentication token to use in the form below (more information in auth section)
      const authToken = await getToken({
        resource: baseUrl,
        command: "authenticate",
        type: "SharePoint"
      })

      // to use an iframe you can use code like:
      // const frame = document.getElementById("iframe-id");
      // const win = frame.contentWindow;

      // now we need to construct our query string
      // options: These are the picker configuration, see the schema link for a full explaination of the available options
      // const queryString = new URLSearchParams({
      //   filePicker: JSON.stringify({}),
      //   locale: "en-us"
      // })

      // // Use MSAL to get a token for your app, specifying the resource as {baseUrl}.
      // // const accessToken = await getToken({});

      // // we create the absolute url by combining the base url, appending the _layouts path, and including the query string
      // const url = baseUrl + `/_layouts/15/FilePicker.aspx?${queryString}`

      // // create a form
      // const form = window.document.createElement("form")

      // // set the action of the form to the url defined above
      // // This will include the query string options for the picker.
      // form.setAttribute("action", url)

      // // must be a post request
      // form.setAttribute("method", "POST")

      // // Create a hidden input element to send the OAuth token to the Picker.
      // // This optional when using a popup window but required when using an iframe.
      // const tokenInput = window.document.createElement("input")
      // tokenInput.setAttribute("type", "hidden")
      // tokenInput.setAttribute("name", "access_token")
      // tokenInput.setAttribute("value", authToken)
      // form.appendChild(tokenInput)

      // // append the form to the body
      // window.document.body.append(form)

      // // submit the form, this will load the picker page
      // form.submit()
    })()
  }, [])

  return (
    <>
      <BlockingScreen />
    </>
  )
})
