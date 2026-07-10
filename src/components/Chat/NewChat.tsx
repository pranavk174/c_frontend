"use client";

import { valueProps } from "@/lib/dummy";

import { useNewChatMutation } from "@/redux/Apis/Chat";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import Tabs from "../Utility/Tabs";
import Checkbox from "../Utility/Checkbox";
import NewChatTab from "./NewChatTab";
import NewGroupTab from "./NewGroupTab";

interface User {
  id: number;
  name: string;
  chat_id: number | null;
  username: string;
  profile_pic?: string;
}

interface NewChatProps {
  users: User[];
  setModal: Dispatch<SetStateAction<valueProps>>;
  // onSelectUser: (user: User) => void;
}

const tabsButton = [
  {
    id: 0,
    label: "Chat",
  },
  {
    id: 1,
    label: "Group",
  },
];

export default function NewChat({
  users,
  setModal,
  // onSelectUser,
}: NewChatProps) {
  const [active, setActive] = useState<number>(0);

  const tabs = [
    <NewChatTab key={0} setModal={setModal} users={users} />,
    <NewGroupTab key={1} setModal={setModal} users={users} />,
  ];

  return (
    <div className="h-[50vh] w-full md:max-w-[60%]  bg-wa-bg-dark flex flex-col">
      {/* Header */}

      <Tabs
        tabs={tabsButton}
        defaultTab="chat"
        onChange={(tabId) => {
          console.log("Active tab:", tabId);
          setActive(Number(tabId));
        }}
      />

      {tabs[active]}
    </div>
  );
}
