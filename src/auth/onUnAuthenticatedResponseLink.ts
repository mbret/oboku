import { onError } from 'apollo-link-error';
import { QueryUserIdDocument } from '../generated/graphql';
import { OfflineApolloClient } from '../useOfflineApolloClient';

export const onUnAuthenticatedResponseLink = onError(({ graphQLErrors, networkError, operation }) => {
  const context = operation.getContext()
  const client = context.client as OfflineApolloClient<any>

  if (graphQLErrors)
    graphQLErrors?.forEach(e => {
      console.log('ASDASD', e)
      if ((e.extensions as any)?.code === 'UNAUTHENTICATED') {
        const data = client.readQuery({ query: QueryUserIdDocument })
        const refId = client.identify({ __typename: 'User', id: data?.user?.id })
        client.modify('User', {
          id: refId,
          fields: {
            token: _ => null,
          }
        })
        console.warn('UNAUTHENTICATED error, user has been logged out')
      }
    })
  if (networkError) console.warn(`[Network error]`, networkError, operation);
});