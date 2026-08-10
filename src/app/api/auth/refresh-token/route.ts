import { refreshTokenGenerateMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, refreshTokenGenerateMutation, undefined, { type: 'auth' })
});
