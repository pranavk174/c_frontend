import { getAllUsersQuery } from "@/graphql/Modules/Users/User.queries";
import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, getAllUsersQuery);
});
