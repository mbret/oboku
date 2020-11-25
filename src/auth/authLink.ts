import { ApolloLink, FetchResult } from "apollo-link"
import { syncLibrary } from "../library/queries"
import { getMainDefinition } from "@apollo/client/utilities"
import { MutationSignupDocument, MutationSigninDocument, MutationEditUserDocument, UserRemoteDataFragmentDoc, QueryUserDocument, MutationLogoutDocument, QueryUserIdDocument } from '../generated/graphql'
import { OfflineApolloClient } from "../useOfflineApolloClient"
import { forOperationAs } from "../utils"

/**
 * @see https://github.com/zenparsing/zen-observable
 * @see https://www.apollographql.com/docs/react/api/link/introduction/
 * @see https://github.com/blackxored/apollo-link-logger/blob/master/src/index.js
 */
export const authLink = new ApolloLink((operation, forward) => {
  const context = operation.getContext()
  const client = context.client as OfflineApolloClient<any>
  const definition = getMainDefinition(operation.query)

  forOperationAs(operation, MutationLogoutDocument, () => {
    const data = client.readQuery({ query: QueryUserIdDocument })
    const refId = client.identify({ __typename: 'User', id: data?.user?.id })
    client.evictRootQuery({ fieldName: 'user' })
    client.evictRootQuery({ fieldName: 'books' })
    client.evictRootQuery({ fieldName: 'tags' })
    client.evictRootQuery({ fieldName: 'collections' })
    client.cache.evict({ id: refId })
  })

  if (definition.name?.value === getMainDefinition(MutationEditUserDocument).name?.value) {
    const incomingData = operation.variables as typeof MutationEditUserDocument['__resultType']
    if (incomingData?.editUser) {
      const refId = client.identify({ __typename: 'User', id: incomingData.editUser.id })
      const userData = client.readFragment({
        id: refId,
        fragment: UserRemoteDataFragmentDoc,
      })
      userData && client.writeFragment({
        id: refId,
        fragment: UserRemoteDataFragmentDoc,
        data: { ...userData, ...incomingData?.editUser }
      })
    }
  }

  return forward(operation)
    /**
     * Listen for outgoing operation
     * 
     * @warning
     * At this point the operation is either successful or on error.
     * We can perform any post operation data such as cleaning or doing 
     * extra operation on cache (adding an item to a list, etc).
     * This is the equivalent of https://www.apollographql.com/docs/react/data/mutations/#updating-the-cache-after-a-mutation
     * Having a centrilized place where we can have the post operation logic 
     * seems to be easier to reason about. It also alleviate the responsability
     * given to the hooks. They can be simpler and only be concerned about
     * dispatching the correct query.
     */
    .map(result => {
      switch (operation.operationName) {
        case 'MutationSignup': {
          const data = (result as FetchResult<typeof MutationSignupDocument['__resultType']>).data
          if (data?.signup) {
            client.writeQuery({
              query: QueryUserDocument,
              data: {
                user: {
                  token: data.signup.token,
                  isLibraryUnlocked: false,
                  ...data.signup.user
                },
              }
            })
            syncLibrary(client).catch(_ => { })
          }
          break
        }
        case 'MutationSignin': {
          const data = (result as FetchResult<typeof MutationSigninDocument['__resultType']>).data
          if (data?.signin) {
            client.writeQuery({
              query: QueryUserDocument,
              data: {
                user: {
                  token: data.signin.token,
                  isLibraryUnlocked: false,
                  ...data.signin.user
                },
              }
            })
            syncLibrary(client).catch(_ => { })
          }
          break
        }
      }

      return result
    })
})