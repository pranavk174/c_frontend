import { NextRequest, NextResponse } from "next/server";
import { boilerPlate, getBoilerplate } from "../../utils";
import {
  getAllchatsQuery,
  getSingleChatQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import {
  deletMessageMutation,

  sendMessageMutation,
} from "@/graphql/Modules/Chat/Chat.mutation";

export const POST = async (req: NextRequest) => {
  const { chat_ids, content, media, reciever_ids, message_ids } =
    await req.json();

  return boilerPlate(
    req,
    sendMessageMutation,
    {
      chat_ids,
      content,
      media,
      reciever_ids,
      message_ids,
    },
    true,
  );
};

export const DELETE = async (req: NextRequest) => {
  const { delete_type, message_ids, chat_ids } = await req.json();

  return boilerPlate(
    req,
    deletMessageMutation,
    {
      delete_type,
      message_ids,
      chat_ids,
    },
    true,
  );
};
