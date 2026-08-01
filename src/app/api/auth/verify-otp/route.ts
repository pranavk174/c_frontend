import { verifyOtpMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { boilerPlate } from "../../utils";


export const POST = async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, verifyOtpMutation, values, { inputs: true, type: 'auth' });
};
