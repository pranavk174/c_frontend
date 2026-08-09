import { NextRequest } from "next/server";
import { boilerPlate } from "../../utils";
import { asyncHandlerBackendApis } from "../../utils";
import { getAllchatsQuery } from "@/graphql/Modules/Chat/Chat.queries";
import { forwardMessageMutation } from "@/graphql/Modules/Chat/Chat.mutation";

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, getAllchatsQuery);
});

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();

  return boilerPlate(req, forwardMessageMutation, values, {
    inputs: true,
  });
});
