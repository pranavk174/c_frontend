import { verifyOtpMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import { logger } from "@/lib/utils";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  logger.debug(values, "valiues in api ");
  return boilerPlate(req, verifyOtpMutation, values, {
    inputs: true,
    type: "auth",
  });
});
