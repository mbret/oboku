import { GetParameterCommand, GetParameterCommandInput, SSMClient } from "@aws-sdk/client-ssm"

const ssm = new SSMClient({ region: "us-east-1" })

type ParameterName =
  | `jwt-private-key`
  | `GOOGLE_CLIENT_SECRET`
  | `GOOGLE_API_KEY`
  | `GOOGLE_CLIENT_ID`

export const getParameterValue = (
  options: Omit<GetParameterCommandInput, `Name`> & {
    Name: ParameterName
  }
) =>
  ssm.send(new GetParameterCommand(options))
    .then((value) => value.Parameter?.Value)
