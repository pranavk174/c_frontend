import { getAllUsersQuery } from "@/graphql/Modules/Users/User.queries";
import { NextRequest, } from "next/server";
import { boilerPlate, } from "../../utils";

export const GET = async (req: NextRequest) => {
    return boilerPlate(req, getAllUsersQuery);
};
