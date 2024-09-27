export class HttpClientError extends Error {
  public response: { data: unknown; original: Response }

  constructor({ data, response }: { response: Response; data: unknown }) {
    super(`Response error with status ${response.status} for ${response.url}`)

    this.response = {
      original: response,
      data
    }
  }
}
