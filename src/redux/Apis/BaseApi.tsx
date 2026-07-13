import { useToast } from "@/components/Utility/Toast";
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

export interface GraphQLResponse<T> {
  data: refreshToken | T | null;
  errors?: GraphQLError[];
}

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  console.log(result, "result dataaaaaaa");
  // Access token expired
  if (result.error?.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh-token",
        method: "POST",
      },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      // Retry original request

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
