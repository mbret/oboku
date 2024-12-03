import {
  GetParameterCommand,
  GetParameterCommandInput,
  GetParametersCommand,
  SSMClient
} from "@aws-sdk/client-ssm"

const ssm = new SSMClient({ region: "us-east-1" })

type ParameterName =
  | `jwt-private-key`
  | `x-access-secret`
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
}) => {
  /**
   * parameters are not necessary in the same order when we get them
   * so we will reorder them
   */
  const orderMap = options.Names.reduce(
    (acc, value, index) => {
      acc[value as string] = index

      return acc
    },
    {} as Record<string, number>
  )

  return ssm.send(new GetParametersCommand(options)).then(
    (value) =>
      value.Parameters?.slice()
        .sort(
          (a, b) =>
            (orderMap[a.Name ?? ``] ?? 1) - (orderMap[b.Name ?? ``] ?? 1)
        )
        .map((parameter) => parameter.Value) ?? []
  )
}
