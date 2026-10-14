import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import { getWallpaperQuery } from "@/graphql/Modules/Chat/Chat.queries";
import { setWallPaperMutation } from "@/graphql/Modules/Chat/Chat.mutation";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, setWallPaperMutation, values, { inputs: true });
});

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, getWallpaperQuery);
});
