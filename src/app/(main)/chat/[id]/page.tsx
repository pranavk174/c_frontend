import React from "react";
import ChatPage from "./ChatPage";
const page = async ({ params }: { params: { id: number } }) => {
  const { id } = await params;

  console.log(typeof id, "iddddddd");
  return (
    <div>
      <ChatPage id={Number(id)} />
    </div>
  );
};

export default page;
