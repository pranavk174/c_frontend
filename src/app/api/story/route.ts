import { NextRequest, NextResponse } from "next/server";

import {
  getEmojiQuery,
  getWallpaperQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import { getStoriesQuery } from "@/graphql/Modules/Story/stories.queries";
import { getBoilerplate } from "../utils";

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getStoriesQuery);
};
