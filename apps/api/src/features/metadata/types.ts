import type {
  BookDocType,
  DataSourceType,
  LinkDocType,
  ProviderApiCredentials,
} from "@oboku/shared"

export type Context = {
  userName: string
  userNameHex: string
  providerCredentials: ProviderApiCredentials<DataSourceType>
  book: BookDocType
  link: LinkDocType
}
