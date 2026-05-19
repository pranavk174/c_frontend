import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Authlayout = async ({ children }: { children: React.ReactNode }) => {
  const token = (await cookies()).get("accessToken");
  console.log(token, "token.....");

  if (!token) {
    redirect("/login");
  }

  return <div>{children}</div>;
};

export default Authlayout;
