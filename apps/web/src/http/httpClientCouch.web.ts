import { HttpClient } from "./httpClient.shared"

class HttpCouchClient extends HttpClient {}

export const httpCouchClient = new HttpCouchClient()
