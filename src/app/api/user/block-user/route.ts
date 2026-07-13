import { blockUserMutation } from "@/graphql/Modules/Users/User.mutation";
import { NextRequest } from "next/server";
import { boilerPlate } from "../../utils";

export const PUT = async (req: NextRequest) => {
  const { blocked_user_id, reason } = await req.json();
  const input = true;
  return boilerPlate(
    req,
    blockUserMutation,
    {
      blocked_user_id,
      reason,
    },
    input,
  );
};
