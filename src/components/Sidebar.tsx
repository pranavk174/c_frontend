"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { chatApi } from "@/redux/Apis/Chat";
import { Chat } from "@/lib/dummy";
import { RootState } from "@/redux/store";
import {
  MessageSquare,
  MoreVertical,
  Search,
  Filter,
  CircleDashed,
  Bell,
} from "lucide-react";
import { modalValue, valueProps } from "@/lib/dummy";
import { cn } from "@/lib/utils";
import { useGetUserQuery, useGetUsersQuery, useLogoutMutation } from "@/redux/Apis/Users";
import { useGetAllChatsQuery } from "@/redux/Apis/Chat";
import { useSelector } from "react-redux";
import WhatsappProfile from "./User/WhatsappProfile";
import Modal from "./HOComponents/Modal";
import WhatsAppNotificationUI from "./Notifications/Notification";
import { useGetNotificationsQuery } from "@/redux/Apis/Notification";
import { useToast } from "./Utility/Toast";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { addUser } from "@/redux/slices/User";
import { NEW_MESSAGE_ALERT } from "@/lib/events";
import { useSocket } from "@/layouts/SocketWrapper";
import { current } from "@reduxjs/toolkit";
import NewChat from "./Chat/NewChat";
export default function Sidebar() {
  const [logout] = useLogoutMutation()
  const pathname = usePathname();
  const [open, setOpen] = useState<valueProps>(modalValue);
  const [searchQuery, setSearchQuery] = useState("");
  const socket = useSocket()
  const dispatch = useAppDispatch()
  const { showToast } = useToast()
  const { user } = useGetUserQuery(null, {
    selectFromResult: ({ data, isLoading, isSuccess }) => {
      // console.log(data?.getUser?.data, "user dataaaaaaaaaaaa");
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

  const { notifications } = useGetNotificationsQuery(null, {
    selectFromResult: ({ data, isLoading, isSuccess }) => {

      return {
        notifications: data?.data?.getNotification?.data?.items,
        isLoading,
        isSuccess
      }
    }
  })

  const { users } = useGetUsersQuery(null, {
    selectFromResult: ({ data, isSuccess }) => {
      return {
        users: data?.data?.getUsers?.data?.items
      }
    }
  })


  console.log(users, "all usersss....")


  const handler = useMemo(() => ({
    [NEW_MESSAGE_ALERT]: (data: Chat) => {


      console.log("data oin new chat", data)

      dispatch(chatApi.util.updateQueryData(
        "getAllChats", {}, (draft) => {

          const chat = draft.data.getAllChats.data.items.find(
            (c: Chat) => c.chat_id === data.chat_id
          );

          if (chat) {

            const currentUnreadCount = chat.unread_count;

            Object.assign(chat, {
              ...data,
              unread_count: currentUnreadCount + data.unread_count,
            });
            // chat.unread_count += data.unread_count;
          }

          console.log(current(draft.data.getAllChats.data.items), "current proxy data")
        }
      ))



    }
  }), [dispatch])

  useSocketEvents(socket, handler)


  useEffect(() => {
    if (user) {
      dispatch(addUser(user))
    }
  })

  // console.log(data, "dataaaaa in chatss");
  const filteredChats = data?.filter((chat: Chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const { onlineUsers } = useSelector(
    (state: RootState) => state.onlineUsersSlice,
  );

  const handleLogout = async () => {
    try {

      await logout(null).unwrap()
    } catch (error) {
      // showToast(error.message, "error")
    }
  }

  return (
    <aside className="w-full h-full flex flex-col bg-wa-panel dark:bg-wa-panel-dark border-r border-wa-divider dark:border-wa-divider-dark">
      {/* Sidebar Header */}
      <header className="h-[60px] bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer">
          <button
            onClick={() => setOpen({
              type: 'profile',
              open: true
            })}
            className="p-0 bg-transparent h-full w-full"
          >
            <Image priority
              src={
                user?.profile_pic ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Me"
              }
              alt="My Profile"
              height={200}
              width={200}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="flex items-center  space-x-4 text-wa-icon dark:text-wa-icon-dark">


          <button onClick={() => setOpen({
            open: true, type: 'notification'
          })} className={`hover:text-green-400 ${notifications?.length > 0 ? '' : 'hidden'} cursor-pointer relative`}>
            <  Bell className="size-5" />
            <span className="size-3 text-white text-[10px] flex items-center justify-center p-1 absolute top-0 right-0 rounded-[50%]   bg-green-500">
              {notifications?.length}
            </span>
          </button>



          <Link
            href="/story"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <CircleDashed className="w-5 h-5" />
          </Link>
          <button onClick={() => setOpen({
            type: 'new-chat',
            open: true
          })} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
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
      <div className="flex flex-col overflow-y-auto  gap-1 px-2 bg-wa-panel dark:bg-wa-panel-dark">
        {filteredChats?.map((chat: Chat) => {
          const isActive = pathname === `/chat/${chat?.chat_id}`;
          // console.log(typeof chat?.chat_id, "royeeeeeetttee")
          return (
            <Link className=" overflow-hidden" href={`/chat/${chat?.chat_id}`} key={chat?.chat_id}>
              <div
                className={cn(

                  "flex items-center rounded-md px-4 py-3 hover:bg-wa-header dark:hover:bg-gray-600 cursor-pointer transition-colors",
                  isActive && "bg-wa-header dark:bg-gray-600",
                )}
              >
                <div className="relative size-12  mr-4 shrink-0 overflow-hidden">
                  <Image priority
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
                <div className="flex-1 min-w-0  border-wa-divider dark:border-wa-divider-dark pb-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-normal text-gray-900 dark:text-gray-100 truncate">
                      {chat?.name}
                    </h3>
                    <span
                      className={cn(
                        "text-xs whitespace-nowrap",
                        chat.unread_count > 0
                          ? "text-wa-primary dark:text-wa-primary-dark font-medium"
                          : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {/* {Date(chat?.last_message_at)} */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                      {chat?.last_message}
                    </p>
                    {chat.unread_count > 0 && (
                      <span className="bg-wa-primary dark:bg-wa-primary-dark text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span>
                    {chat.last_message_at.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Modal values={open} setModal={setOpen}>
        {user && open.type === "profile" && (
          <WhatsappProfile setOpen={setOpen} isUser={true} profile={user} />
        )}

        {
          users && open.type === "new-chat" && <NewChat users={users} />
        }

        {open.type === "notification" && (
          <WhatsAppNotificationUI notifications={notifications} />
        )}
      </Modal>
    </aside >
  );
}
