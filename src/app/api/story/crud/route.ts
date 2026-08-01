import { NextRequest } from "next/server";



import { getStoriesQuery } from "@/graphql/Modules/Story/stories.queries";
import { boilerPlate } from "../../utils";
import { createStoryMutation } from "@/graphql/Modules/Story/stories.mutation";

export const GET = async (req: NextRequest) => {
  return boilerPlate(req, getStoriesQuery);
};


export const POST = async (req: NextRequest) => {

  const values = await req.json();
  return boilerPlate(req, createStoryMutation, values, {
    inputs: true
  },)
}



