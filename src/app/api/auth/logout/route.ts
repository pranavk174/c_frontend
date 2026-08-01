import { logoutMutaion } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { boilerPlate } from "../../utils";


export const POST = async (req: NextRequest) => {

  const res = await boilerPlate(req, logoutMutaion, undefined, { type: "auth" })
  res.cookies.delete("accessToken");
  res.cookies.delete("refreshToken");



  return res;

};
