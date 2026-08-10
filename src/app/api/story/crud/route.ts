import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import { getStoriesQuery } from "@/graphql/Modules/Story/stories.queries";
import { createStoryMutation } from "@/graphql/Modules/Story/stories.mutation";

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, getStoriesQuery);
});

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, createStoryMutation, values, { inputs: true });
});
