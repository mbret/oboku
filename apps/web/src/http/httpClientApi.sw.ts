import { firstValueFrom } from "rxjs"
import { HttpClient } from "./httpClient.shared"
import { serviceWorkerCommunication } from "../workers/communication/communication.sw"

export const httpClientApi = new HttpClient()

httpClientApi.useRequestInterceptor(async (config) => {
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
