import { NextRequest } from "next/server";
import { boilerPlate } from "../../utils";
import { getEmojiQuery } from "@/graphql/Modules/Chat/Chat.queries";

export const GET = async (req: NextRequest) => {
  return boilerPlate(req, getEmojiQuery);
};
