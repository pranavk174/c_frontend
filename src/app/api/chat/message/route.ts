import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import {
  deletMessageMutation,
  sendMessageMutation,
} from "@/graphql/Modules/Chat/Chat.mutation";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, sendMessageMutation, values, { inputs: true });
});

export const DELETE = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, deletMessageMutation, values, { inputs: true });
});
