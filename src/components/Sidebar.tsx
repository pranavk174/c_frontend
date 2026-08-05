"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Menu,
  LogOut,
} from "lucide-react";
import { modalValue, valueProps } from "@/lib/dummy";
import { asyncHandler, cn } from "@/lib/utils";
import {
  useGetUserQuery,
  useGetUsersQuery,
  useLogoutMutation,
  useUpdatePreferenceMutation,
} from "@/redux/Apis/Users";
import { useGetAllChatsQuery } from "@/redux/Apis/Chat";
import { useSelector } from "react-redux";
import WhatsappProfile from "./User/WhatsappProfile";
import Modal from "./HOComponents/Modal";
import WhatsAppNotificationUI from "./Notifications/Notification";
import {
  NotificationApi,
  useGetNotificationsQuery,
} from "@/redux/Apis/Notification";
import { useToast } from "./Utility/Toast";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { addUser } from "@/redux/slices/User";
import { NEW_MESSAGE_ALERT, SEEN_NOTIFICATION } from "@/lib/events";
import { useSocket } from "@/layouts/SocketWrapper";
import { current } from "@reduxjs/toolkit";
import NewChat from "./Chat/NewChat";
import SoundToggle from "./Utility/Togglebuton";
import DarkthemeToggle from "./Utility/DarkthemeToggle";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils";

export default function Sidebar() {
  const [logout] = useLogoutMutation();
  const pathname = usePathname();
  const [open, setOpen] = useState<valueProps>(modalValue);
  const [expanded, setExpanded] = useState<boolean>(true);

  const [current, setCurrent] = useState<"chats" | "newChat" | "stories">(
    "chats",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { chatSocket: socket, notificationSocket } = useSocket();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const route = useRouter();
  const { user } = useGetUserQuery(null, {
    selectFromResult: ({ data, isLoading, isSuccess }) => {
      // logger.log(data?.getUser?.data, "user dataaaaaaaaaaaa");
      return {
        user: data?.data?.getUser?.data,
        isLoading,
        isSuccess,
      };
    },
  });

  const { data, chatsLoading } = useGetAllChatsQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
        return {
          data: data?.data?.getAllChats?.data.items,
          chatsLoading: isLoading,
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
        isSuccess,
      };
    },
  });

  const { users } = useGetUsersQuery(null, {
    selectFromResult: ({ data, isSuccess }) => {
      return {
        users: data?.data?.getUsers?.data?.items,
      };
    },
  });

  logger.log(users, "all usersss....");

  const handler = useMemo(
    () => ({
      [NEW_MESSAGE_ALERT]: (data: Chat) => {
        dispatch(
          chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
            const chat = draft.data.getAllChats.data.items.find(
              (c: Chat) => c.chat_id === data.chat_id,
            );

            if (chat) {
              const currentUnreadCount = chat.unread_count;

              Object.assign(chat, {
                ...data,
                unread_count: currentUnreadCount + data.unread_count,
              });
              // chat.unread_count += data.unread_count;
            }
          }),
        );
      },
      [SEEN_NOTIFICATION]: (data: any) => {
        dispatch(
          NotificationApi.util.updateQueryData(
            "getNotifications",
            null,
            (draft) => {
              draft.data.getNotification.data.items = [];
              // if (notification) {
              //   notification.isSeen = data.isSeen
              // }
            },
          ),
        );
      },
    }),
    [dispatch],
  );

  useSocketEvents(socket, handler);

  useEffect(() => {
    if (user) {
      dispatch(addUser(user));
    }
  });

  // logger.log(data, "dataaaaa in chatss");
  const filteredChats = useMemo(() => data?.filter((chat: Chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  ), [data, searchQuery]);

  const { onlineUsers } = useSelector(
    (state: RootState) => state.onlineUsersSlice,
  );

  const handleLogout = asyncHandler(async () => {

    await logout(null).unwrap();
    document.documentElement.classList.remove("dark", "light");
    route.replace("/login");

  });

  return (
    <aside
      className={`w-full pl-2 gap-1 py-2    relative min-w-22.5 ${!expanded ? "max-w-[12%] lg:max-w-[5.5%]" : "max-w-[70%] md:max-w-[25%]"}  transition-all duration-400   flex bg-wa-panel dark:bg-wa-panel-dark border-r border-wa-divider dark:border-wa-divider-dark`}
    >
      {/* Sidebar Header */}

      {/* {expanded ? ( */}
      <header className=" border-r p-2 bg-wa-sidebar-menu dark:bg-wa-sidebar-menu-dark border-wa-divider dark:border-wa-divider-dark  flex flex-col gap-3 items-center   ">
        <div className=" flex justify-center items-center   cursor-pointer">
          <button
            onClick={() =>
              setOpen({
                type: "profile",
                open: true,
              })
            }
            className=" bg-transparent overflow-hidden rounded-full  w-15 h-15"
          >
            <Image
              priority
              src={
                user?.profile_pic ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Me"
              }
              alt="My Profile"
              height={250}
              width={200}
              className="w-full h-full object-cover "
            />
          </button>
        </div>
        <div className="flex flex-col justify-between h-full  items-center  text-wa-icon dark:text-wa-icon-dark ">
          <div className="flex flex-col gap-3 justify-between items-center">
            <button
              onClick={() =>
                setOpen({
                  open: true,
                  type: "notification",
                })
              }
              className={`hover:text-green-400 ${notifications?.length > 0 ? "" : "hidden"} cursor-pointer relative`}
            >
              <Bell className="size-6" />
              <span className="size-3 text-white text-[10px] flex items-center justify-center p-1 absolute top-0 right-0 rounded-[50%]   bg-green-500">
                {notifications?.length}
              </span>
            </button>

            <Link
              href="/story"
              className={`p-3 rounded-full  ${pathname.includes("story") && "bg-black/5"} hover:bg-black/5  dark:hover:bg-white/5 transition`}
            >
              <CircleDashed className="size-6" />
            </Link>

            <button
              onClick={() =>
                setOpen({
                  type: "new-chat",
                  open: true,
                })
              }
              className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <MessageSquare className="size-6" />
            </button>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <Menu className="size-6" />
            </button>

            <DarkthemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <LogOut className="size-6" />
          </button>
        </div>
      </header>
      {/* ) : (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="p-2 mx-auto mt-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <Menu className="size-6" />
        </button>
      )} */}

      {/* Search Bar */}
      {/* {current === "chats" && ( */}
      <div
        className={`transition-all overflow-hidden relative rounded-lg  bg-wa-sidebar-menu p-2 w-full duration-400 rleative ${expanded ? "z-1 md:z-0" : ""}`}
      >
        <div className="p-2 rounded-lg shrink-0 bg-green-400 dark:bg-wa-panel-dark border-b border-wa-divider dark:border-wa-divider-dark flex items-center space-x-2">
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
            <Filter className="size-6" />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex mt-2  flex-col relative overflow-y-auto overflow-x-hidden  gap-1 h-full ">
          {chatsLoading
            ? [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex space-x-4 px-4 py-3 rounded-md"
              >
                <div className="rounded-full bg-gray-200 dark:bg-gray-700 size-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))
            : filteredChats?.map((chat: Chat) => {
              const isActive = pathname === `/chat/${chat?.chat_id}`;
              // logger.log(chat?.chat_id, "royeeeeeetttee", onlineUsers.includes(String(chat.user_id)), chat)
              return (
                <Link
                  className=" overflow-hidden"
                  href={`/chat/${chat?.chat_id}?chat_type=${chat.chat_type}`}
                  key={chat?.chat_id}
                >
                  <div
                    className={cn(
                      " flex flex-col md:flex-row items-center rounded-md px-4  py-3 hover:bg-wa-header dark:hover:bg-gray-600 cursor-pointer transition-colors",
                      isActive && "bg-wa-header dark:bg-gray-600",
                    )}
                  >
                    <div className="relative size-12   mr-4 shrink-0 overflow-hidden">
                      <Image
                        priority
                        fill
                        sizes="48px"
                        src={chat?.profile_pic}
                        alt={chat?.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                      {chat.user_id !== null && (
                        <span
                          className={`size-2.5 ${onlineUsers.includes(String(chat.user_id)) || chat.isOnline ? "block" : "invisible"} absolute bottom-1 right-0  bg-green-400 rounded-[50%]`}
                        ></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0  border-wa-divider dark:border-wa-divider-dark pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-base words-break text-wrap  font-normal text-gray-900 dark:text-gray-100 truncate">
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
                          {chat?.last_message &&
                            chat?.last_message.length > 10
                            ? `${chat?.last_message.substring(0, 10)}...`
                            : chat.last_message}
                        </p>
                        {chat?.unread_count > 0 && (
                          <span className="bg-wa-primary dark:bg-wa-primary-dark text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {chat?.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {/* <span>{chat?.last_message_at?.toLocaleString()}</span> */}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
      {/* )} */}

      <Modal values={open} setModal={setOpen}>
        {user && open.type === "profile" && (
          <WhatsappProfile setOpen={setOpen} isUser={true} profile={user} />
        )}

        {users && open.type === "new-chat" && (
          <NewChat setModal={setOpen} users={users} />
        )}

        {open.type === "notification" && (
          <WhatsAppNotificationUI notifications={notifications} />
        )}
      </Modal>
    </aside>
  );
}
