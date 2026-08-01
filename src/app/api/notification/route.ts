import { NextRequest } from "next/server";
import { getAllNotifictaionQuery } from "@/graphql/Modules/Notifications/notifications.queries";
import { boilerPlate } from "../utils";
import { seenNotification } from "@/graphql/Modules/Notifications/notifications.mutation";

export const GET = async (req: NextRequest) => {
  return boilerPlate(req, getAllNotifictaionQuery);
};
export const PUT = async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, seenNotification, values, {
    inputs: true
  },);

};
