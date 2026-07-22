import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

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
}

interface errors {
  errors?: GraphQLError[];
}
export interface GraphQLResponse<T> {
  data: refreshToken | errors | T | null;
}

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
});

type BaseQueryResult = ReturnType<typeof baseQuery>;
let refreshPromise: Promise<Awaited<BaseQueryResult>> | null = null;
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  const data = result?.data as errors | null;
  console.log(data?.errors?.[0].message, "result dataaaaaaa");

  // Access token expired

  if (data?.errors?.[0].message === "invalid signature") {
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
      localStorage.removeItem("user");
      window.location.href = "/login";
      return;
    });
  }

  if (
    result?.error?.status === 401 &&
    data?.errors?.[0].message !== "invalid signature"
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
      result = await baseQuery(args, api, extraOptions);
    } else {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  return result;
};

export default baseQueryWithReauth;

export const BaseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["chats", "User", "story", "wallpaper", "emoji"],
  endpoints: () => ({}),
});
