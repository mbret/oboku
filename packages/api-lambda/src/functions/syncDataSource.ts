import { lambda } from "../lambda"
import { getAwsLambda } from "../utils"

const awsLambda = getAwsLambda()

export const fn = lambda(async (event) => {
  await awsLambda.invoke({
    InvocationType: 'Event',
    FunctionName: 'oboku-api-SyncDataSourceLongProcessFunction-1VJE722JSJ5VJ',
    ...process.env.AWS_SAM_LOCAL && {
      InvocationType: 'RequestResponse',
      FunctionName: 'SyncDataSourceLongProcessFunction',
    },
    Payload: JSON.stringify(event),
  }).promise()

  return {
    statusCode: 202,
    body: JSON.stringify({}),
  }
})