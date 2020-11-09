import { ApolloLink, FetchResult } from "apollo-link"
import { MutationSigninData, QueryAuthData, QueryUser, QueryAuth, QueryUserData, MutationSignupData, MutationEditUser } from "./queries"
import { ApolloClient, InMemoryCache } from "@apollo/client"
import { syncLibrary } from "../library/queries"
import { getMainDefinition } from "@apollo/client/utilities"
import { MutationEditUserVariables } from "oboku-shared"

/**
 * @see https://github.com/zenparsing/zen-observable
 * @see https://www.apollographql.com/docs/react/api/link/introduction/
 * @see https://github.com/blackxored/apollo-link-logger/blob/master/src/index.js
 */
export const authLink = new ApolloLink((operation, forward) => {
  const context = operation.getContext()
  const cache = context.cache as InMemoryCache
  const client = context.client as ApolloClient<any>
  const definition = getMainDefinition(operation.query)

  /**
   * Listen for incoming operation
   * 
   * @warning
   * I am not sure yet if it's a good idea to perform logic on incoming
   * operation such as doing the cache update here rather than the hooks
   * or offline resolvers. The reason is that some other link could retry
   * some of the mutation. A good example is the queue Link which will
   * replay everything on restore. Although we could filter out the incoming 
   * replayed operation by checking the context (isReplayed: true), I keep
   * wondering whether it's a good idea or not.
   */
  // ...

  if (definition.name?.value === getMainDefinition(MutationEditUser).name?.value) {
    const incomingData = operation.variables as MutationEditUserVariables
    const data = client.readQuery<QueryUserData>({ query: QueryUser })
    data && client.writeQuery<QueryUserData>({ query: QueryUser, data: { user: { ...data.user, ...incomingData } } })
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
          const data = (result as FetchResult<MutationSignupData>).data
          if (data?.signup) {
            const userData = { ...data?.signup.user, isLibraryUnlocked: false }
            cache.writeQuery<QueryAuthData>({ query: QueryAuth, data: { auth: { token: data?.signup.token } } })
            cache.writeQuery<QueryUserData>({ query: QueryUser, data: { user: userData } })
            syncLibrary(client).catch(_ => { })
          }
          break
        }
        case 'MutationSignin': {
          const data = (result as FetchResult<MutationSigninData>).data
          if (data?.signin) {
            const userData = { ...data?.signin.user, isLibraryUnlocked: false }
            cache.writeQuery<QueryAuthData>({ query: QueryAuth, data: { auth: { token: data?.signin.token } } })
            cache.writeQuery<QueryUserData>({ query: QueryUser, data: { user: userData } })
            syncLibrary(client).catch(_ => { })
          }
          break
        }
      }

      return result
    })
})