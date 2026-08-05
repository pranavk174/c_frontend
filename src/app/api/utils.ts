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

  const response = await api({
    ...config,
    url: "/graphql",
    method: "POST",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
      Cookie: cookie ?? "",
    },
  });

  return response;
};

export const boilerPlate = async (
  req: NextRequest,
  graphQlQuery: string,
  values = {},
  { inputs = false,
    type = 'general' } = {}
) => {
  try {

    const response = await backendRequests(req, {
      data: JSON.stringify({
        query: graphQlQuery,
        variables: inputs ? { input: values } : values,
      }),
    });

    if (response.data.errors) {
      throw response.data.errors[0];
      return NextResponse.json(
        {
          success: response.data.errors[0].success,
          message: response.data.errors[0].message,
          errors: response.data.errors,
        },
        {
          status: response.data.errors[0].status,
        },
      );
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

      if (type === 'auth') {
        const cookies = response.headers["set-cookie"];

        if (Array.isArray(cookies)) {
          cookies.forEach((cookie) => {
            res.headers.append("Set-Cookie", cookie);
          });
        }

      }

      return res;
    }
  } catch (error) {
    // logger.log(error);

    // GraphQL errors thrown from response.data.errors[0] carry an `extensions` field
    const gqlError = error as { message?: string; extensions?: { status?: number; code?: string } };
    const axiosErr = error as AxiosError;

    const status = gqlError.extensions?.status ?? 500;
    const code = gqlError.extensions?.code;
    const message = gqlError.message ?? axiosErr.message ?? "Something went wrong";


    // logger.log(message, code, status, "error data", error[Object.keys(error)[6]].data)

    return NextResponse.json(
      {
        success: false,
        message,
        error: message,
        status,
        code,
      },
      { status },
    );
  }
};
