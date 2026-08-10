import { createUserMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();

  return boilerPlate(req, createUserMutation, values, {
    inputs: true
  });

});
