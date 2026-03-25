import { keepPreviousData, type QueryKey, useQuery } from "@tanstack/react-query";
import type { AxiosRequestConfig } from "axios";
import { apiClient, getApiErrorMessage, type QueryParams } from "@/lib/api-client";

type UseAppQueryOptions<TData, TSelect = TData> = {
  queryKey: QueryKey;
  url: string;
  params?: QueryParams;
  requestConfig?: Omit<AxiosRequestConfig, "url" | "method" | "params">;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  select?: (data: TData) => TSelect;
  keepPrevious?: boolean;
  fallbackError?: string;
};

export function useAppQuery<TData, TSelect = TData>({
  queryKey,
  url,
  params,
  requestConfig,
  enabled,
  staleTime,
  gcTime,
  select,
  keepPrevious,
  fallbackError = "Failed to fetch data.",
}: UseAppQueryOptions<TData, TSelect>) {
  return useQuery<TData, Error, TSelect>({
    queryKey,
    enabled,
    staleTime,
    gcTime,
    select,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    queryFn: async ({ signal }) => {
      try {
        const { data } = await apiClient.get<TData>(url, {
          ...requestConfig,
          params,
          signal,
        });
        return data;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, fallbackError));
      }
    },
  });
}


