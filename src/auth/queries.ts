import { gql, useMutation, useQuery, useApolloClient, } from "@apollo/client";
import { useCallback } from "react";
import { MutationSignupVariables, User, MutationSigninVariables, MutationEditUserVariables, hashContentPassword } from 'oboku-shared'

export type LocalUser = User & {
  isLibraryUnlocked?: boolean,
}

export const UserFragment = gql`
  fragment UserFragment on User {
    __typename
    id
    email
    contentPassword
    isLibraryUnlocked @client
  }
`

export type QueryUserData = { user: Required<LocalUser> }
export const QueryUser = gql`
  query QueryUser {
    user {
      ...UserFragment
    }
  }
  ${UserFragment}
`

export type MutationSignupData = { signup: { token: string, user: Required<User> } }
export const MutationSignup = gql`
  mutation MutationSignup($email: String!, $password: String!) @asyncQueue @blocking @noRetry {
    signup(email: $email, password: $password) {
      token
      user {
        ...UserFragment
      }
    }
  }
  ${UserFragment}
`

export type MutationSigninData = { signin: { token: string, user: Required<User> } }
export const MutationSignin = gql`
  mutation MutationSignin($email: String!, $password: String!) @asyncQueue @blocking @noRetry {
    signin(email: $email, password: $password) {
      token
      user {
        ...UserFragment
      }
    }
  }
  ${UserFragment}
`


export type MutationEditUserData = { editUser: { id: NonNullable<User['id']> } & Pick<User, 'contentPassword'> }
export const MutationEditUser = gql`
  mutation MutationEditUser($id: ID!, $contentPassword: String) {
    editUser(id: $id, contentPassword: $contentPassword) {
      ...UserFragment
    }
  }
  ${UserFragment}
`

export type QueryAuthData = { auth: { token: string | null } }
export const QueryAuth = gql`
  query QueryAuth {
    auth @client {
      token
    }
  }
`

export const useSignup = () => {
  const [signup, result] = useMutation<MutationSignupData, MutationSignupVariables>(MutationSignup)

  const enhancedQuery = useCallback(async (email: string, password: string) => {
    return signup({ variables: { email, password }, }).catch(_ => { })
  }, [signup])

  return [enhancedQuery, result] as [typeof enhancedQuery, typeof result]
}

export const useSignin = () => {
  const [signin, result] = useMutation<MutationSigninData, MutationSigninVariables>(MutationSignin)

  const enhancedQuery = useCallback(async (email: string, password: string) => {
    return signin({ variables: { email, password }, }).catch(_ => { })
  }, [signin])

  return [enhancedQuery, result] as [typeof enhancedQuery, typeof result]
}

export const useEditUser = () => {
  const [editUser] = useMutation<MutationEditUserData, MutationEditUserVariables>(MutationEditUser)
  const client = useApolloClient()

  return useCallback(async (variables: Pick<LocalUser, 'contentPassword'>) => {
    const contentPassword = variables.contentPassword
      ? new TextDecoder().decode((await hashContentPassword(variables.contentPassword)))
      : variables.contentPassword

    const data = client.readQuery<QueryUserData>({ query: QueryUser })
    if (data) {
      return editUser({ variables: { id: data.user.id, ...variables, contentPassword }, }).catch(_ => { })
    }
  }, [editUser, client])
}

export const useUser = () => useQuery<QueryUserData>(QueryUser)

export const useAuth = () => useQuery<QueryAuthData>(QueryAuth)

export const useToggleContentProtection = () => {
  const client = useApolloClient()

  return useCallback(() => {
    const data = client.readQuery<QueryUserData>({ query: QueryUser })
    if (data) {
      client.writeQuery<QueryUserData>({ query: QueryUser, data: { user: { ...data.user, isLibraryUnlocked: !data.user.isLibraryUnlocked } } })
    }
  }, [client])
}

export const useSignOut = () => {
  const client = useApolloClient()

  return useCallback(() => {
    client.cache.writeQuery<QueryAuthData>({ query: QueryAuth, data: { auth: { token: null } } })
  }, [client])
}