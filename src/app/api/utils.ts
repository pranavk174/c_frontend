import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";

const api = axios.create({
  baseURL: process.env.BASE_URL,
  withCredentials: true,
});

export const backendRequests = async (
  req: NextRequest,
  config: AxiosRequestConfig,
) => {
  const cookie = req.headers.get("cookie");

  const accessToken = cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("accessToken="))
    ?.slice("accessToken=".length);

  // if (!cookie) {
  //   return NextResponse.json({
  //     message: "Cookie dats not available",
  //     status: 401,
  //     success: false,
  //   });
  // }

  // const cookies = Object.fromEntries(
  //   cookie
  //     .split(";")
  //     .filter(Boolean)
  //     .map((item) => {
  //       const index = item.indexOf("=");
  //       const key = item.slice(0, index).trim();
  //       const value = item.slice(index + 1).trim();

  //       return [key, value];
  //     }),
  // );

  // logger.debug("cookie data", accessToken, cookies);
  const response = await api({
    ...config,
    url: "/graphql",
    method: "POST",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
  });

  return response;
};

export const boilerPlate = async (
  req: NextRequest,
  graphQlQuery: string,
  values = {},
  { inputs = false, type = "general" } = {},
) => {
  const response = await backendRequests(req, {
    data: JSON.stringify({
      query: graphQlQuery,
      variables: inputs ? { input: values } : values,
    }),
  });

  if (response.data.errors) {
    throw response.data.errors[0];
    // return NextResponse.json(
    //   {
    //     success: response.data.errors[0].success,
    //     message: response.data.errors[0].message,
    //     errors: response.data.errors,
    //   },
    //   {
    //     status: response.data.errors[0].status,
    //   },
    // );
  } else {
    const key = Object.keys(response.data.data)[0];

    // logger.debug(key, response.data[key]);
    // logger.debug(
    //   "reposne in json...",
    //   response.data,
    //   key,
    //   response.data.data[key].status,
    // );

    const res = NextResponse.json(
      {
        success: response.data.data[key].success,
        message: response.data.data[key].message,
        data: response.data.data,
      },
      {
        status: response.data.data[key].status,
      },
    );

    if (type === "auth") {
      const cookies = response.headers["set-cookie"];

      if (Array.isArray(cookies)) {
        cookies.forEach((cookie) => {
          res.headers.append("Set-Cookie", cookie);
        });
      }
    }

    return res;
  }
};

type GqlError = {
  message?: string;
  path?: string[];
  extensions?: {
    status?: number;
    code?: string;
  };
};

type AggregateErrorType = {
  name?: string;
  message?: string;
  code?: string;
};

type AsyncHandlerOptions = {
  onError?: (error: unknown) => void;
  onFinally?: () => void;
};

export const asyncHandlerBackendApis =
  <Args extends unknown[], Response = NextResponse>(
    fn: (...args: Args) => Promise<Response>,
    options?: AsyncHandlerOptions,
  ) =>
  async (...args: Args): Promise<Response | NextResponse> => {
    try {
      return await fn(...args);
    } catch (error: unknown) {
      options?.onError?.(error);

      const gqlError = error as GqlError;
      const aggregateError = error as AggregateErrorType;
      const axiosError = error as AxiosError;

      const status = gqlError.extensions?.status ?? 500;

      const code =
        gqlError.extensions?.code ?? aggregateError.code ?? axiosError.code;

      const message =
        gqlError.message ??
        axiosError.message ??
        aggregateError.message ??
        "Something went wrong";

      logger.log(
        aggregateError.code,
        message,
        code,
        status,
        "error data",
        aggregateError.name,
        gqlError?.path?.[0],
        error,
      );

      const res = NextResponse.json(
        {
          success: false,
          message,
          error: message,
          status,
          code,
          api: gqlError?.path?.[0],
        },
        { status },
      );

      if (gqlError?.path?.[0] === "logout") {
        res.cookies.delete("accessToken");
        res.cookies.delete("refreshToken");
      }

      logger.info(res, "response in api");

      return res;
    } finally {
      options?.onFinally?.();
    }
  };
