import React from "react";
import VerifyOtp from "./VerifyOtp";
const page = async ({ params }: { params: { email: string } }) => {
  const { email } = await params;

  return (
    <div>
      <VerifyOtp email={decodeURIComponent(email)} />
    </div>
  );
};

export default page;
