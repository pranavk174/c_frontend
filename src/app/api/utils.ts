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
    const err = error as AxiosError;

    logger.debug(err, "==========");
    logger.log(err.response?.data, { depth: null });
    // logger.log(err);
    // logger.log(error);
    logger.log(err.response);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wronsssssg",
        error: (err.response?.data, { depth: null }),
        status: err.response?.request.res.statusCode,
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

    if (response.data.errors) {
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
      // logger.log(response.data, "logger data in response");
      const key = Object.keys(response.data.data)[0];

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

      // logger.debug(
      //   res,
      //   "response in json... in get",
      //   response.data,
      //   key,
      //   response.data.data[key].status,
      // );

      return res;
    }
  } catch (error) {
    const err = error as AxiosError;

    // logger.debug(err.response, "==========", err);
    // logger.log(err);
    // logger.log(err.response?.request.res.statusMessage);
    // logger.log(err.response?.request.res, { depth: null }, "===============");
    return NextResponse.json(
      {
        success: false,

        message:
          err.response?.request.res.statusMessage ??
          "Something went wrossssssng",
        error: err.response?.data,
        status: err.response?.request.res.statusCode,
      },
      {
        status: err.response?.request.res.statusCode,
      },
    );
  }
};
