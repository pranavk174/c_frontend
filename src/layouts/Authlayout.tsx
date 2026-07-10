import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Authlayout = async ({ children }: { children: React.ReactNode }) => {
  const token = (await cookies()).get("accessToken");
  const theme = (await cookies()).get("theme")?.value;
  console.log(token, "token.....", theme);

  if (!token) {
    redirect("/login");
  }

  return <div>{children}</div>;
};

export default Authlayout;
