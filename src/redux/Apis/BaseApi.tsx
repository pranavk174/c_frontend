import { useToast } from "@/components/Utility/Toast";
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

export const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/graphql`,
  credentials: "include",
});

export interface refreshToken {
  data: {

    generateRefreshToken: {
      status?: number;
      success?: boolean;
      message?: string;
      error?: string
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

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  const data = result.data as GraphQLResponse<unknown>;

  // console.log(data, result, "result dataaa");
  // access token expired
  if (
    data &&
    data.errors &&
    data?.errors?.[0]?.message === "Invalid access token"
  ) {
    // refresh token call
    const refreshResult = await baseQuery(
      {
        url: "",
        method: "POST",
        body: {
          query: `
          mutation generateRefreshToken{
    generateRefreshToken{
        message,status,success,error
    }
}
    
          `,
        },
      },
      api,
      extraOptions,
    );


    if ("data" in refreshResult) {
      const refreshData = refreshResult.data as GraphQLResponse<refreshToken>;

      if (
        refreshData.data?.data?.generateRefreshToken?.status !== 401
      ) {
        result = await baseQuery(args, api, extraOptions);
      } else {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

  } else if (!data) {
    console.log(data, "error dataaaaa");
    // throw new Error("Internal Server Error");
  } else if (data.errors?.length) {
    console.log("error in base api", data.errors[0]);

    return {
      error: {
        status: 500,
        data: data.errors[0],
      },
    };
  }

  // console.log(data, "data isn base api...")

  return result;
};

export const BaseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["chats", "User", "story", "wallpaper"],
  endpoints: () => ({}),
});
