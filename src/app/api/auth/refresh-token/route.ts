import { refreshTokenGenerateMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { boilerPlate } from "../../utils";

export const POST = async (req: NextRequest) => {
  return boilerPlate(req, refreshTokenGenerateMutation, undefined, { type: 'auth' })
};
