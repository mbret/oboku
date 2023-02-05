import { handlerPath } from "@libs/handler-resolver"
import schema from "./schema"

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaDefault",
  events: [
    {
      http: {
        method: "post",
        path: "signin",
        // handle preflight cors
        cors: true,
        request: {
          schemas: {
            "application/json": schema
          }
        }
      }
    }
  ]
}
