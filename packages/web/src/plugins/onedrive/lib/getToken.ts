import { PublicClientApplication } from "@azure/msal-browser"
import { combine } from "@pnp/core"

type IAuthenticateCommand = {
  resource: string
  command: "authenticate"
  type: "SharePoint"
}

const msalConfig = {
  auth: {
    clientId: "c05918e7-93ac-45fe-85f0-9779bf2ded53"
  }
}

const msalInstance = new PublicClientApplication(msalConfig)

msalInstance
  .initialize()
  .then(() => {
    console.log("INITIALIZED")
  })
  .catch(console.error)

export async function getToken(command: IAuthenticateCommand): Promise<string> {
  let accessToken = ""
  const authParams = { scopes: [`${combine(command.resource, ".default")}`] }

  try {
    const account = msalInstance.lo({}) || undefined

    // see if we have already the idtoken saved
    const resp = await msalInstance.acquireTokenSilent({
      //   scopes: ["https://onedrive.live.com/picker.default"]
      scopes: ["User.Read"],
      account
    })

    debugger
    accessToken = resp.accessToken
  } catch (e) {
    debugger
    // per examples we fall back to popup
    const resp = await msalInstance.loginPopup(authParams!)
    msalInstance.setActiveAccount(resp.account)

    if (resp.idToken) {
      const resp2 = await msalInstance.acquireTokenSilent(authParams!)
      accessToken = resp2.accessToken
    } else {
      // throw the error that brought us here
      throw e
    }
  }

  return accessToken
}
