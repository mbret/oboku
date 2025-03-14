import { LambdaClient } from "@aws-sdk/client-lambda"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/types"

export const getAwsLambda = (config: ConfigService<EnvironmentVariables>) =>
  new LambdaClient({
    region: "us-east-1",
    ...(config.getOrThrow("OFFLINE", { infer: true }) && {
      endpoint: `http://localhost:3002`,
    }),
  })
