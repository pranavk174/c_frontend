import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import { getSingleChatQuery } from "@/graphql/Modules/Chat/Chat.queries";
import {
  deletMessageMutation,
  newChatMutation,
} from "@/graphql/Modules/Chat/Chat.mutation";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, newChatMutation, values, { inputs: false });
});

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const chat_ids = searchParams.getAll("chat_ids");
  const limit = searchParams.get("limit");
  const cursor = searchParams.get("cursor");
  return boilerPlate(
    req,
    getSingleChatQuery,
    {
      chat_ids: Number(chat_ids),
      limit: Number(limit),
      cursor: Number(cursor),
    },
    { inputs: true },
  );
});

export const DELETE = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, deletMessageMutation, values, { inputs: true });
});
