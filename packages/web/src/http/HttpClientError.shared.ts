export class HttpClientError extends Error {
  constructor(
    public response: {
      data: unknown
    }
  ) {
    super("HttpClient response error")
    this.response = response
  }
}
