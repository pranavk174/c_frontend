import { unBlockUserMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";

export const PUT = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, unBlockUserMutation, values, { inputs: true });
});
