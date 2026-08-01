import { getUserQuery } from "@/graphql/Modules/Users/User.queries";
import { NextRequest } from "next/server";
import { boilerPlate } from "../../utils";
import {
  updatePreference,
  updateUserMutation,
} from "@/graphql/Modules/Users/User.mutation";

export const GET = async (req: NextRequest) => {
  return boilerPlate(req, getUserQuery);
};

export const PUT = async (req: NextRequest) => {
  const values = await req.json();

  return boilerPlate(
    req,
    updateUserMutation,
    values,
    {
      inputs: true
    }
  );
};

export const PATCH = async (req: NextRequest) => {
  const values = await req.json();

  console.log(values, "valuesss")

  return boilerPlate(req, updatePreference, values, {
    inputs: true
  });
};
