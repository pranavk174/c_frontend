import React from "react";
import ChatPage from "./ChatPage";
const page = async ({ params }: { params: { id: number } }) => {
  const { id } = await params;


  return (<ChatPage id={Number(id)} />

  );
};

export default page;
