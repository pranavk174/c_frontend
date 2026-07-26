import { NextRequest, NextResponse } from "next/server";

import { boilerPlate, getBoilerplate } from "../../utils";
import { createStoryMutation, replySToryMutation } from "@/graphql/Modules/Story/stories.mutation";




export const POST = async (req: NextRequest) => {
  const { id,
    content, } = await req.json()
  return boilerPlate(req, replySToryMutation, {
    id,
    content,
  }, false)
}



