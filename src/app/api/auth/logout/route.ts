import { logoutMutaion } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "../../utils";
import { logger } from "@/lib/utils";


export const POST = async (req: NextRequest) => {
  try {
    const response = await backendRequest(req, {
      data: JSON.stringify({
        query: logoutMutaion,
      }),
    });

    const data = response.data;

    const cookies = response.headers["set-cookie"];
    const res = NextResponse.json(data, {
      status: response.status,
    });
    if (Array.isArray(cookies)) {
      cookies.forEach((cookie) => {
        res.headers.append("Set-Cookie", cookie);
      });
    }
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");

    logger.log(res, "reponse in logout..");

    return res;
  } catch (error) {
    const res = NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      },
    );

    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");

    return res;
  }
};
