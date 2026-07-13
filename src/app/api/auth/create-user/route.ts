import { loginMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest, NextResponse } from "next/server";
import { backendRequests } from "../../utils";

export const POST = async (req: NextRequest) => {
  try {
    const { email } = await req.json();
    const response = await backendRequests(req, {
      data: JSON.stringify({
        query: loginMutation,
        variables: {
          email,
        },
      }),
    });
    const res = NextResponse.json(response.data, {
      status: response.status,
    });

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
