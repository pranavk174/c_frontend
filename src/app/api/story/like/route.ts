import { NextRequest } from "next/server";

import { boilerPlate } from "../../utils";
import { likeStoryMutation } from "@/graphql/Modules/Story/stories.mutation";


export const POST = async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, likeStoryMutation, values, {
    inputs: true
  },)
}



