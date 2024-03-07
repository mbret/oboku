import { handlerPath } from "@libs/handler-resolver"

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaDefault",
  /**
   * This lambda can be heavy on local development.
   * To avoid memory issues and CPU overuse we lock
   * it at 1 concurrency
   */
  ...(process.env.OFFLINE === "true" && {
    reservedConcurrency: 1
  }),
  timeout: 60 * 15 // 15mn
}
