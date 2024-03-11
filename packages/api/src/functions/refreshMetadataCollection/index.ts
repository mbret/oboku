import { handlerPath } from "@libs/handler-resolver"

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaDefault",
  /**
   * Because this lambda check and lock the process
   * we need to avoid concurrent access. This way we ensure
   * the lock is always checked in sync.
   *
   * This lambda should stay simple and fast (check/lock)
   */
  reservedConcurrency: 1,
  events: [
    {
      http: {
        method: "post",
        path: "refresh-metadata-collection",
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
