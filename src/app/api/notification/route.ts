import { NextRequest } from "next/server";
import { asyncHandlerBackendApis, boilerPlate } from "../utils";
import { getAllNotifictaionQuery } from "@/graphql/Modules/Notifications/notifications.queries";
import { seenNotification } from "@/graphql/Modules/Notifications/notifications.mutation";

export const GET = asyncHandlerBackendApis(async (req: NextRequest) => {
  return boilerPlate(req, getAllNotifictaionQuery);
});

export const PUT = asyncHandlerBackendApis(async (req: NextRequest) => {
  const values = await req.json();
  return boilerPlate(req, seenNotification, values, { inputs: true });
});
