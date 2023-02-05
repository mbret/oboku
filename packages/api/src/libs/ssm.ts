import { SSM } from "aws-sdk"

const ssm = new SSM({ region: "us-east-1" })

type ParameterName =
  | `jwt-private-key`
  | `GOOGLE_CLIENT_SECRET`
  | `GOOGLE_API_KEY`
  | `GOOGLE_CLIENT_ID`

export const getParameterValue = (
  options: Omit<SSM.GetParameterRequest, `Name`> & {
    Name: ParameterName
  }
) =>
  ssm
    .getParameter(options)
    .promise()
    .then((value) => value.Parameter?.Value)
