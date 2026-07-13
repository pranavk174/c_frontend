import axios, { AxiosRequestConfig } from "axios";
import { NextRequest, NextResponse } from "next/server";

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
    console.dir(error.response?.data, { depth: null });
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
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
    console.log(error, "error in api");
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
};
