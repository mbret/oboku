import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAuthTokenAsync } from "@libs/auth"
import schema from "./schema"
import { getParametersValue } from "@libs/ssm"
import { supabase } from "@libs/supabase/client"
import { withMiddy } from "@libs/middy/withMiddy"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const authorization = event.headers.authorization ?? ``

  const [jwtPrivateKey = ``] = await getParametersValue({
    Names: ["jwt-private-key"],
    WithDecryption: true
  })

  const { name } = await getAuthTokenAsync(
    {
      headers: {
        authorization
      }
    },
    jwtPrivateKey
  )

  const reportsResponse = await supabase
    .from("sync_reports")
    .select("*")
    .eq("user_name", name)

  return {
    statusCode: 200,
    body: JSON.stringify(reportsResponse.data || [])
  }
}

export const main = withMiddy(lambda, {
  withJsonBodyParser: false
})
