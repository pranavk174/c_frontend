import { NextRequest, NextResponse } from "next/server";

import {
  getEmojiQuery,
  getWallpaperQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import { getStoriesQuery } from "@/graphql/Modules/Story/stories.queries";
import { boilerPlate, getBoilerplate } from "../../utils";
import { createStoryMutation } from "@/graphql/Modules/Story/stories.mutation";

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getStoriesQuery);
};


export const POST = async (req: NextRequest) => {
  const { text_data,
    content,
    message_ids } = await req.json()
  return boilerPlate(req, createStoryMutation, {
    text_data,
    content,
    message_ids,
  }, true)
}



