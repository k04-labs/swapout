import type { MutationKey, QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-client";

type UseAppMutationOptions<TData, TVariables> = {
  mutationKey?: MutationKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateQueryKeys?: QueryKey[];
  fallbackError?: string;
  onSuccess?: (data: TData, variables: TVariables) => Promise<void> | void;
  onError?: (error: Error, variables: TVariables) => Promise<void> | void;
};

export function useAppMutation<TData, TVariables = void>({
  mutationKey,
  mutationFn,
  invalidateQueryKeys,
  fallbackError = "Request failed.",
  onSuccess,
  onError,
}: UseAppMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationKey,
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw new Error(getApiErrorMessage(error, fallbackError));
      }
    },
    onSuccess: async (data, variables) => {
      if (invalidateQueryKeys?.length) {
        await Promise.all(
          invalidateQueryKeys.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
      }
      await onSuccess?.(data, variables);
    },
    onError: async (error, variables) => {
      await onError?.(error, variables);
    },
  });
}
