import { useApolloClient } from "@apollo/client";
import { useClient } from "./client";

export const useOfflineApolloClient = () => useApolloClient() as NonNullable<ReturnType<typeof useClient>>