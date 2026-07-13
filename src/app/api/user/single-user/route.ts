import { getUserQuery } from "@/graphql/Modules/Users/User.queries";
import { NextRequest, NextResponse } from "next/server";
import { boilerPlate, getBoilerplate } from "../../utils";
import {
  updatePreference,
  updateUserMutation,
} from "@/graphql/Modules/Users/User.mutation";

export const GET = async (req: NextRequest) => {
  return getBoilerplate(req, getUserQuery);
};

export const PUT = async (req: NextRequest) => {
  const { name, profile_pic, bio, cover_pic, theme } = await req.json();
  const input = true;
  return boilerPlate(
    req,
    updateUserMutation,
    {
      name,
      profile_pic,
      bio,
      cover_pic,
      theme,
    },
    input,
  );
};

export const PATCH = async (req: NextRequest) => {
  const { theme } = await req.json();

  const input = true;

  return boilerPlate(req, updatePreference, { theme }, input);
};
