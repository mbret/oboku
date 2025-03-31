import { firstValueFrom } from "rxjs"
import { HttpClient } from "./httpClient.shared"
import { serviceWorkerCommunication } from "../workers/communication/communication.sw"

const httpApiClient = new HttpClient()

httpApiClient.useRequestInterceptor(async (config) => {
  const auth = await firstValueFrom(serviceWorkerCommunication.askAuth())

  if (auth.payload.accessToken) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${auth.payload.accessToken}`,
      },
    }
  }

  return config
})
