import { logger } from "@/lib/utils";
import axios, { AxiosInstance } from "axios";
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { showGlobalToast } from "../toastservices";

export interface refreshToken {
  data: {
    generateRefreshToken: {
      status?: number;
      success?: boolean;
      message?: string;
      error?: string;
    };
  };
}

export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

export interface GraphQLError {
  message: string;
  locations: GraphQLErrorLocation[];
  path: string[];
  extensions?: {
    status: number;
    code: string;
  };
}

interface errors {
  errors?: GraphQLError[];
  message: string;
  success?: boolean;
}
export interface GraphQLResponse<T> {
  data: refreshToken | errors | T | null;
}

const api: AxiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
});

const controllers = new Map<string, AbortController>();

function getRequest(args: string | FetchArgs) {
  const url = typeof args === "string" ? args : args.url!;

  controllers?.get(url)?.abort();

  const controller = new AbortController();
  controllers?.set(url, controller);

  return {
    ...(typeof args === "string" ? { url } : args),
    signal: controller.signal,
  };
}
type BaseQueryResult = ReturnType<typeof baseQuery>;
let refreshPromise: Promise<Awaited<BaseQueryResult>> | null = null;
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = null;
  result = await baseQuery(getRequest(args), api, extraOptions);

  if (result.error) {
    const errorData = result?.error?.data as errors | null;
    showGlobalToast(errorData?.message ?? "", "error");
    logger.debug(result?.error, "result dataaa");
  }

  const data = result?.data as errors | null;
  // logger.log(data?.errors?.[0].message, "result dataaaaaaa", data?.errors?.[0]?.extensions?.status);

  // Access token expired

  if (data?.errors) {
    showGlobalToast(data?.errors?.[0].message ?? "", "error");
    if (data?.errors?.[0].message === "invalid signature") {
      if (!refreshPromise) {
        refreshPromise = Promise.resolve(
          baseQuery(
            {
              url: "/auth/logout",
              method: "POST",
            },
            api,
            extraOptions,
          ),
        ).finally(() => {
          refreshPromise = null;
          localStorage.removeItem("persist:root");
          localStorage.removeItem("device_id");
          localStorage.removeItem("user");
          localStorage.removeItem("persist:root");
          window.location.href = "/login";
          return;
        });
      }
    }

    if (
      data?.errors?.[0]?.extensions?.status === 401 &&
      data?.errors?.[0].message === "jwt expired"
    ) {
      if (!refreshPromise) {
        refreshPromise = Promise.resolve(
          baseQuery(
            {
              url: "/auth/refresh-token",
              method: "POST",
            },
            api,
            extraOptions,
          ),
        ).finally(() => {
          refreshPromise = null;
        });
      }

      const refreshResult = await refreshPromise;

      if (refreshResult.data) {
        result = null;

        result = await baseQuery(getRequest(args), api, extraOptions);
      } else {
        localStorage.removeItem("user");
        window.location.href = "/login";
        localStorage.removeItem("persist:root");
        localStorage.removeItem("device_id");
        localStorage.removeItem("user");
        localStorage.removeItem("persist:root");
      }
    }
    // return null;
    // throw new Error(data?.errors?.[0].message)
  }

  if (data?.success) {
    showGlobalToast(data?.message ?? "", "success");
  }

  logger.debug(result, data, "data in response ");

  return result;
};

export default baseQueryWithReauth;

export const BaseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["chats", "User", "story", "wallpaper", "emoji", "notification"],
  endpoints: () => ({}),
});
