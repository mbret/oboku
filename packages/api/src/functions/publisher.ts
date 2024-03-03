import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs"

const sqs = new SQSClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION
})

exports.handler = async function (event: any, context: any) {
  console.log({ event, context })
  const command = new SendMessageCommand({
    QueueUrl: process.env.QUEUE_URL,
    // Any message data we want to send
    MessageBody: JSON.stringify({
      fileName: "foo/bar.mp4"
    })
  })

  // Send a message into SQS
  await sqs.send(command)
}
