import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";


const api = axios.create({
  baseURL: process.env.BASE_URL,
  withCredentials: true,
});

export const backendRequest = async (
  req: NextRequest,
  config: AxiosRequestConfig,
) => {
  const cookie = req.headers.get("cookie");

  return api({
    ...config,
    url: "/graphql",
    method: "POST",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
      Cookie: cookie ?? "",
    },
  });
};

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
  inputs = false,
) => {
  try {
    const response = await backendRequests(req, {
      data: JSON.stringify({
        query: graphQlQuery,
        variables: inputs ? { input: { ...values } } : { ...values },
      }),
    });

    const res = NextResponse.json(response.data, {
      status: response.status,
    });

    return res;
  } catch (error) {
    const err = error as AxiosError;

    logger.log(err.response?.data, { depth: null });
    logger.log(err);
    logger.log(error);
    logger.log(err.response);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
        error: (err.response?.data, { depth: null }),
      },
      {
        status: err.response?.request.res.statusCode,
      },
    );
  }
};

export const getBoilerplate = async (
  req: NextRequest,
  graphQlQuery: string,
  values = {},
  params = false,
) => {
  try {
    const response = await backendRequests(req, {
      data: JSON.stringify({
        query: graphQlQuery,
        variables: { ...values },
      }),
    });

    const res = NextResponse.json(response.data, {
      status: response.status,
    });

    return res;
  } catch (error) {
    const err = error as AxiosError;

    // logger.log(err.response?.data, { depth: null });
    // logger.log(err);
    logger.log(err.response?.request.res.statusMessage);
    logger.log(err.response?.request.res, { depth: null }, "===============");
    return NextResponse.json(
      {
        success: false,

        message:
          err.response?.request.res.statusMessage ?? "Something went wrong",
        error: err.response?.data,
      },
      {
        status: err.response?.request.res.statusCode,
      },
    );
  }
};
