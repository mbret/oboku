import { handlerPath } from "@libs/handler-resolver"

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaDefault",
  events: [
    {
      http: {
        method: "get",
        path: "sync/reports",
        // handle preflight cors
        cors: true
      }
    }
  ]
}
