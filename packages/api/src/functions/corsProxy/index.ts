import { handlerPath } from "@libs/handler-resolver"

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaDefault",
  events: [
    {
      http: {
        method: "get",
        path: "cors",
        // handle preflight cors
        cors: true
      }
    }
  ]
}
