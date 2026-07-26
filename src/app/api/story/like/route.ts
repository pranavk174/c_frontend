import { NextRequest, NextResponse } from "next/server";

import {
  getEmojiQuery,
  getWallpaperQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import { getStoriesQuery } from "@/graphql/Modules/Story/stories.queries";
import { boilerPlate, getBoilerplate } from "../../utils";
import { createStoryMutation, likeStoryMutation } from "@/graphql/Modules/Story/stories.mutation";


export const POST = async (req: NextRequest) => {
  const { id,
    reaction_id,
    like, } = await req.json()
  return boilerPlate(req, likeStoryMutation, {
    id,
    reaction_id,
    like,
  }, true)
}



