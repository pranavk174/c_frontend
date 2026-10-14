import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../../utils";
import { likeStoryMutation } from "@/graphql/Modules/Story/stories.mutation";

export const POST = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, likeStoryMutation, values, { inputs: true });
});
