import { getAwsLambda, lambda } from "../utils"

const awsLambda = getAwsLambda()

export const fn = lambda(async (event) => {

  await awsLambda.invoke({
    InvocationType: 'Event',
    FunctionName: 'oboku-api-RefreshMetadataLongProcessFunction-1FN5C0L9PKJAY',
    ...process.env.AWS_SAM_LOCAL && {
      InvocationType: 'RequestResponse',
      FunctionName: 'RefreshMetadataLongProcessFunction',
    },
    Payload: JSON.stringify(event),
  }).promise()

  return {
    statusCode: 202,
    body: JSON.stringify({}),
  }
})