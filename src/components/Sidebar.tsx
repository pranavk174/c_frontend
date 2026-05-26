"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RootState } from "@/redux/store";
import {
  MessageSquare,
  MoreVertical,
  Search,
  Filter,
  CircleDashed,
} from "lucide-react";
import { Chat } from "@/lib/dummy";
import { cn } from "@/lib/utils";
import { useGetAllChatsQuery, useGetUserQuery } from "@/redux/Apis/User";
import { useSelector } from "react-redux";
import WhatsappProfile from "./User/WhatsappProfile";
import Modal from "./HOComponents/Modal";
export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useGetUserQuery(null, {
    selectFromResult: ({ data, isLoading, isSuccess }) => {
      console.log(data?.getUser?.data, "user dataaaaaaaaaaaa");
      return {
        user: data?.data?.getUser?.data,
        isLoading,
        isSuccess,
      };
    },
  });

  const { data, isLoading, isSuccess } = useGetAllChatsQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
        return {
          data: data?.data?.getAllChats?.data.items,
          isLoading,
          isSuccess,
        };
      },
    },
  );

  // console.log(data, "dataaaaa in chatss");
  const filteredChats = data?.filter((chat: Chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const { onlineUsers } = useSelector(
    (state: RootState) => state.onlineUsersSlice,
  );

  console.log(user?.profile_pic, "user profile dataaaa")

  return (
    <aside className="w-full h-full flex flex-col bg-wa-panel dark:bg-wa-panel-dark border-r border-wa-divider dark:border-wa-divider-dark">
      {/* Sidebar Header */}
      <header className="h-[60px] bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer">
          <button
            onClick={() => setOpen(true)}
            className="p-0 bg-transparent h-full w-full"
          >
            <Image
              src={user?.profile_pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Me"}
              alt="My Profile"
              height={200}
              width={200}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="flex items-center space-x-4 text-wa-icon dark:text-wa-icon-dark">
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <CircleDashed className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-2 shrink-0 bg-wa-panel dark:bg-wa-panel-dark border-b border-wa-divider dark:border-wa-divider-dark flex items-center space-x-2">
        <div className="flex-1 flex items-center bg-wa-search dark:bg-wa-search-dark rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-wa-icon dark:text-wa-icon-dark mr-3" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm dark:text-white"
          />
        </div>
        <button className="p-2 text-wa-icon dark:text-wa-icon-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-wa-panel dark:bg-wa-panel-dark">
        {filteredChats?.map((chat: Chat) => {
          const isActive = pathname === `/chat/${chat?.chat_id}`;
          // console.log(typeof chat?.chat_id, "royeeeeeetttee")
          return (
            <Link href={`/chat/${chat?.chat_id}`} key={chat?.chat_id}>
              <div
                className={cn(
                  "flex items-center px-4 py-3 hover:bg-wa-header dark:hover:bg-wa-header-dark cursor-pointer transition-colors",
                  isActive && "bg-wa-header dark:bg-wa-header-dark",
                )}
              >
                <div className="relative w-[48px] h-[48px]  mr-4 shrink-0 overflow-hidden">
                  <Image
                    // style={{ height: "auto", width: "auto" }}
                    // height={300}
                    // width={300}
                    fill
                    sizes="48px"
                    src={chat?.profile_pic}
                    alt={chat?.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span
                    className={`size-[10px] ${onlineUsers.includes(chat.user_id.toString()) || chat.isOnline ? "block" : "invisible"} absolute bottom-1 right-0 z-30 bg-green-400 rounded-[50%]`}
                  ></span>
                </div>
                <div className="flex-1 min-w-0 border-b border-wa-divider dark:border-wa-divider-dark pb-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-normal text-gray-900 dark:text-gray-100 truncate">
                      {chat?.name}
                    </h3>
                    <span
                      className={cn(
                        "text-xs whitespace-nowrap",
                        // chat.unread > 0
                        //   ? "text-wa-primary dark:text-wa-primary-dark font-medium"
                        //   : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {/* {Date(chat?.last_message_at)} */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                      {chat?.last_message}
                    </p>
                    {/* {chat.unread > 0 && (
                      <span className="bg-wa-primary dark:bg-wa-primary-dark text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {chat.unread}
                      </span>
                    )} */}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>



      <Modal open={open} setOpen={setOpen}>
        {user && <WhatsappProfile setOpen={setOpen} isUser={true} profile={user} />}

      </Modal>
    </aside>
  );
}
