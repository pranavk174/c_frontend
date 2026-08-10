import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import { getEmojiQuery } from "@/graphql/Modules/Chat/Chat.queries";

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, getEmojiQuery);
});
