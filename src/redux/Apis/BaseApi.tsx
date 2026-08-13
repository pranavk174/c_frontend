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
import { log } from "node:console";

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
    error: string;
  };
}

interface errors {
  error?: string;
  message: string;
  success?: boolean;
  status: number;
  code: string | number;
}
export interface GraphQLResponse<T> {
  data: refreshToken | errors | T | null;
}

// const baseQuery: AxiosInstance = axios.create({
//   baseURL: "/api",
//   withCredentials: true,
// });

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
let logOutPromise: Promise<Awaited<BaseQueryResult>> | null = null;
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = null;
  result = await baseQuery(args, api, extraOptions);

  // logger.log(result.error, "result data errorrrr");

  if (result.error) {
    // const data = result.error?.data as errors | undefined;
    const data = result.error.data as unknown as errors | null;
    showGlobalToast(data?.message ?? "", "error");
    if (data?.message === "invalid signature") {
      if (!logOutPromise) {
        logOutPromise = Promise.resolve(
          baseQuery(
            {
              url: "/auth/logout",
              method: "POST",
            },
            api,
            extraOptions,
          ),
        ).finally(() => {
          logOutPromise = null;
          localStorage.removeItem("persist:root");
          localStorage.removeItem("device_id");
          localStorage.removeItem("user");
          localStorage.removeItem("persist:root");
          window.location.href = "/login";
          return;
        });
      }
    }

    logger.info(data, "error responbse");

    if (data?.status === 401 && data?.message === "jwt expired") {
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
      logger.debug(refreshResult.error, "errorrrrrr");
      logger.debug(refreshResult?.data, "refresh token response in base api");
      if (refreshResult?.error) {
        if (!logOutPromise) {
          logOutPromise = Promise.resolve(
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

        await logOutPromise
        // throw new Error(refreshResult?.error?.status);
      }
      if (refreshResult?.data) {
        result = null;

        result = await baseQuery(args, api, extraOptions);
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

  // logger.debug(result, "result data in api")
  // if (result?.success) {
  //   showGlobalToast(result?.message ?? "", "success");
  // }

  // logger.debug(result, data, "data in response ");

  return result;
};

export default baseQueryWithReauth;

export const BaseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["chats", "User", "story", "wallpaper", "emoji", "notification"],
  endpoints: () => ({}),
});
