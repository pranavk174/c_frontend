import { NextRequest, NextResponse } from "next/server";
import { boilerPlate, getBoilerplate } from "../../utils";
import {
  getAllchatsQuery,
  getSingleChatQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import { newChatMutation } from "@/graphql/Modules/Chat/Chat.mutation";

export const POST = async (req: NextRequest) => {
  const { member_id } = await req.json();
  return boilerPlate(
    req,
    newChatMutation,
    {
      member_id,
    },
    false,
  );
};

export const GET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const chat_ids = searchParams.getAll("chat_ids"); // ?chat_ids=1&chat_ids=2
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
    true,
  );
};
