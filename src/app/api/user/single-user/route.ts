import { getUserQuery } from "@/graphql/Modules/Users/User.queries";
import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import {
  updatePreference,
  updateUserMutation,
} from "@/graphql/Modules/Users/User.mutation";
import { logger } from "@/lib/utils";

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, getUserQuery);
});

export const PUT = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, updateUserMutation, values, { inputs: true });
});

export const PATCH = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  logger.log(values, "valuesss");
  return boilerPlate(req, updatePreference, values, { inputs: true });
});
