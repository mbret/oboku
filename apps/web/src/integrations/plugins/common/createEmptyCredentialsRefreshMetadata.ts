import type { SourceType } from "@oboku/shared"
import { type UseMutationOptions, useMutation } from "@tanstack/react-query"
import type { UseRefreshMetadataVariables } from "../types"

export const createEmptyCredentialsRefreshMetadata = <T extends SourceType>() =>
  function useRefreshMetadata({ meta }: Pick<UseMutationOptions, "meta">) {
    return useMutation({
      meta,
      mutationFn: async function resolveEmptyCredentials(
        _variables: UseRefreshMetadataVariables<T>,
      ) {
        return { providerCredentials: {} }
      },
    })
  }
