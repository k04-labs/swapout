import axios from "axios";

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

export function getApiErrorMessage(
  error: unknown,
  fallback = "Request failed.",
): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { message?: string }
      | string
      | undefined;

    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof responseData.message === "string"
    ) {
      return responseData.message;
    }

    if (typeof responseData === "string" && responseData.trim().length > 0) {
      return responseData;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
