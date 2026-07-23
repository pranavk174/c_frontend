import { NextRequest, NextResponse } from "next/server";
import { boilerPlate, getBoilerplate } from "../../utils";
import { getAllchatsQuery } from "@/graphql/Modules/Chat/Chat.queries";
import { forwardMessageMutation } from "@/graphql/Modules/Chat/Chat.mutation";

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getAllchatsQuery);
};


export const POST = async (req: NextRequest) => {


  const { reciever_ids, chat_ids, message_ids } = await req.json()

  return boilerPlate(req, forwardMessageMutation, { reciever_ids, chat_ids, message_ids }, true)



}