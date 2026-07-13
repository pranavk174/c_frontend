import { NextRequest, NextResponse } from "next/server";

import {
  getEmojiQuery,
  getMemberQuery,
  getWallpaperQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import { boilerPlate, getBoilerplate } from "@/app/api/utils";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ chat_id: string }> },
) => {
  const { chat_id } = await params;
  return boilerPlate(req, getMemberQuery, { chat_ids: Number(chat_id) }, true);
};
