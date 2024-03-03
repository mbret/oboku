exports.handler = function (event: any, context: any) {
  // SQS may invoke with multiple messages
  for (const message of event.Records) {
    const bodyData = JSON.parse(message.body)

    const fileName = bodyData.fileName
    // do something with `fileName`
  }
}
