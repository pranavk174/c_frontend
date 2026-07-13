import { verifyOtpMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest, NextResponse } from "next/server";
import { backendRequests } from "../../utils";
import { AxiosError } from "axios";

export const POST = async (req: NextRequest) => {
  const { email, otp, device_id, ip_address, location, device_name } =
    await req.json();
  try {
    console.log("triggered");
    const response = await backendRequests(req, {
      data: JSON.stringify({
        query: verifyOtpMutation,
        variables: {
          input: {
            email,
            otp,
            device_id,
            ip_address,
            location,
            device_name,
          },
        },
      }),
    });

    console.log(response, "response in verifuy output");

    const res = NextResponse.json(response.data, {
      status: response.status,
    });

    // Backend se aayi Set-Cookie

    const cookies = response.headers["set-cookie"];

    if (Array.isArray(cookies)) {
      cookies.forEach((cookie) => {
        res.headers.append("Set-Cookie", cookie);
      });
    }

    //   return res;
    return res;
  } catch (error) {
    const err = error as AxiosError;
    console.log(err.response?.data, { depth: null });
    console.log(err);
    console.log(error);
    console.log(err.response);
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
