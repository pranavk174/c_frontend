import { getAllUsersQuery } from "@/graphql/Modules/Users/User.queries";
import { NextRequest, NextResponse } from "next/server";
import { backendRequest, backendRequests, getBoilerplate } from "../../utils";

export const GET = async (req: NextRequest) => {
 return getBoilerplate(req, getAllUsersQuery);
};
