import { NextRequest } from "next/server";
import { getSingleChatQuery } from "@/graphql/Modules/Chat/Chat.queries";
import { newGroupMutation } from "@/graphql/Modules/Chat/Chat.mutation";
import { asyncHandlerBackendApis, boilerPlate } from "@/app/api/utils";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, newGroupMutation, values, { inputs: true });
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
