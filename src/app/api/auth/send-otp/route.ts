import { loginMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest, NextResponse } from "next/server";
import { backendRequests, boilerPlate } from "../../utils";

export const POST = async (req: NextRequest) => {
  const { email } = await req.json();
  return boilerPlate(req, loginMutation, {
    email,
  });
};
