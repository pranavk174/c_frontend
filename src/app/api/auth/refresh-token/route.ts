import { refreshTokenGenerateMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest, NextResponse } from "next/server";
import { backendRequests } from "../../utils";

export const POST = async (req: NextRequest) => {
  try {
    const response = await backendRequests(req, {
      data: JSON.stringify({
        query: refreshTokenGenerateMutation,
      }),
    });
    const res = NextResponse.json(response.data, {
      status: response.status,
    });
    const cookies = response.headers["set-cookie"];

    if (Array.isArray(cookies)) {
      cookies.forEach((cookie) => {
        res.headers.append("Set-Cookie", cookie);
      });
    }

    return res;
  } catch (error) {
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
