import { handlerPath } from "@libs/handler-resolver"

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaDefault",
  events: [
    {
      http: {
        method: "post",
        path: "refresh-metadata",
        // handle preflight cors
        cors: {
          origin: `*`,
          headers: [
            "Content-Type",
            "X-Amz-Date",
            "Authorization",
            "X-Api-Key",
            "X-Amz-Security-Token",
            "X-Amz-User-Agent",
            "oboku-credentials"
          ]
        }
      }
    }
  ]
}
