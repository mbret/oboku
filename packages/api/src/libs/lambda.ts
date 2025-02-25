import { OFFLINE } from "../constants"
import { LambdaClient } from "@aws-sdk/client-lambda"

export const getAwsLambda = () =>
  new LambdaClient({
    region: "us-east-1",
    ...(OFFLINE && {
      endpoint: `http://localhost:3002`,
    }),
  })
