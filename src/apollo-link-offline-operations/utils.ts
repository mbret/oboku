import { getMainDefinition as bloodyBrokenTypedFunction } from "@apollo/client/utilities"
import { OperationTypeNode } from "graphql"

type GetMainDefinitionUnbrokenType = ReturnType<typeof bloodyBrokenTypedFunction> & { operation?: OperationTypeNode }
export const getMainDefinition = (query: Parameters<typeof bloodyBrokenTypedFunction>[0]): GetMainDefinitionUnbrokenType => {
  return bloodyBrokenTypedFunction(query)
}