import { NextRequest, NextResponse } from "next/server";
import { getBoilerplate } from "../../utils";
import { getEmojiQuery } from "@/graphql/Modules/Chat/Chat.queries";

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getEmojiQuery);
};
