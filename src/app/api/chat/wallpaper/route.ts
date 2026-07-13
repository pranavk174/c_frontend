import { NextRequest, NextResponse } from "next/server";
import { getBoilerplate } from "../../utils";
import {
  getEmojiQuery,
  getWallpaperQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import { setWallPaperMutation } from "@/graphql/Modules/Chat/Chat.mutation";

export const POST = async (req: NextRequest) => {
  const { url } = await req.json();
  return getBoilerplate(req, setWallPaperMutation, { url }, true);
};

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getWallpaperQuery);
};
