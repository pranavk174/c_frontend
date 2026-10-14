import { NextRequest } from "next/server";
import { getMemberQuery } from "@/graphql/Modules/Chat/Chat.queries";
import { asyncHandlerBackendApis, boilerPlate } from "@/app/api/utils";

export const GET = asyncHandlerBackendApis(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ chat_id: string }> },
  ) => {
    const { chat_id } = await params;
    return boilerPlate(
      req,
      getMemberQuery,
      { chat_ids: Number(chat_id) },
      { inputs: true },
    );
  },
);
