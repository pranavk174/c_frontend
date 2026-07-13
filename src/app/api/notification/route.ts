import { NextRequest, NextResponse } from "next/server";
import { getAllNotifictaionQuery } from "@/graphql/Modules/Notifications/notifications.queries";
import { getBoilerplate } from "../utils";

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getAllNotifictaionQuery);
};
