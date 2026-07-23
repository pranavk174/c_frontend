import { NextRequest, NextResponse } from "next/server";
import { getAllNotifictaionQuery } from "@/graphql/Modules/Notifications/notifications.queries";
import { boilerPlate, getBoilerplate } from "../utils";
import { seenNotification } from "@/graphql/Modules/Notifications/notifications.mutation";

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getAllNotifictaionQuery);
};
export const PUT = async (req: NextRequest) => {

  const { notification_ids } = await req.json()
  return boilerPlate(req, seenNotification, { notification_ids }, true);
  return NextResponse.json({ message: "Hello World" });
};
