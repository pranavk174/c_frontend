import { NextRequest, NextResponse } from "next/server";

import {
  getAllchatsQuery,
  getSingleChatQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import {
  newChatMutation,
  newGroupMutation,
} from "@/graphql/Modules/Chat/Chat.mutation";
import { boilerPlate } from "@/app/api/utils";

export const POST = async (req: NextRequest) => {
  const {
    groupName,
    profile_pic,
    member_ids: members,
    cover_pic,
  } = await req.json();
  return boilerPlate(
    req,
    newGroupMutation,
    {
      groupName,
      profile_pic,
      member_ids: members,
      cover_pic,
    },
    true,
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
