import {
  GetParameterCommand,
  GetParameterCommandInput,
  GetParametersCommand,
  SSMClient
} from "@aws-sdk/client-ssm"

const ssm = new SSMClient({ region: "us-east-1" })

type ParameterName =
  | `jwt-private-key`
  | `GOOGLE_CLIENT_SECRET`
  | `GOOGLE_API_KEY`
  | `GOOGLE_CLIENT_ID`
  | `COMiCVINE_API_KEY`

export const getParameterValue = (
  options: Omit<GetParameterCommandInput, `Name`> & {
    Name: ParameterName
  }
) =>
  ssm
    .send(new GetParameterCommand(options))
    .then((value) => value.Parameter?.Value)

export const getParametersValue = (options: {
  Names: ParameterName[]
  WithDecryption: boolean
}) =>
  ssm
    .send(new GetParametersCommand(options))
    .then(
      (value) => value.Parameters?.map((parameter) => parameter.Value) ?? []
    )
