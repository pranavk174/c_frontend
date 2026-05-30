import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

export const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.BASE_URL}/graphql`,
  credentials: "include",
});

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
  data: T | null;
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

    // refresh success
    if (refreshResult.data) {
      // retry original api
      result = await baseQuery(args, api, extraOptions);
    } else {
      // logout user
      localStorage.removeItem("user");

      // optional redirect
      window.location.href = "/login";
    }
  } else if (!data) {
    console.log(data, "error dataaaaa");
    throw new Error("Internal Server Error");
  }

  return result;
};

export const BaseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["chats", "User", "story"],
  endpoints: () => ({}),
});
