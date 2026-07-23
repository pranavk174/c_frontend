import React, { useCallback } from "react";
import Image from "next/image";
import Checkbox from "../Utility/Checkbox";
import { NewChatProps } from "@/lib/dummy";
import { useRouter } from "next/navigation";
import { useNewChatMutation } from "@/redux/Apis/Chat";
import UserCard from "../User/UserCard";
import { logger } from "@/lib/utils";

const NewChatTab = ({ users, setModal }: NewChatProps) => {
  const router = useRouter();
  const [newChat] = useNewChatMutation();

  const handleCreate =
    useCallback(async (
      member_id: number,
      chat_id: number | null = null,
    ) => {
      try {

        logger.debug(chat_id, member_id, "=========== member id dataaa")
        if (chat_id !== null) {
          router.push(`/chat/${chat_id}?chat_type=private`);
          logger.log("ye chat dataaaa");
        } else {
          const data = await newChat({ member_id }).unwrap();
          if (data.data.createNewChat.data.chat_id) {
            logger.log(data.data.createNewChat.data.chat_id, "chat idddd");
            router.push(
              `/chat/${data.data.createNewChat.data.chat_id}?chat_type=private`,
            );
          }
        }
        return;
      } catch (error) {
        logger.log(error, "error in creating chat...");
      } finally {
        setModal({
          open: false,
          type: null,
        });
      }
    }, [newChat, router, setModal])
  return (
    <>
      {" "}
      <div className="bg-[#202c33] px-4 py-4 border-b border-wa-search-input-dark">
        <h2 className="text-xl font-semibold text-white">New Chat</h2>
      </div>
      {/* Search */}
      <div className="bg-wa-bg-dark p-3 border-b border-wa-search-input-dark">
        <input
          type="text"
          placeholder="Search name..."
          className="w-full bg-[#202c33] text-white placeholder:text-gray-400 rounded-lg px-4 py-2 outline-none"
        />
      </div>
      {/* Users */}
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <div>
            <div className="flex   flex-1 justify-center items-center ">
              <h3 className="font-bold text-white text-[clamp(16px,50vw,17px)]">
                No New Users Found
              </h3>
            </div>
          </div>
        ) : (
          users.map((user) => (
            <UserCard key={user.id} handleCreate={handleCreate} user={user} type={"chat"} />
          ))
        )}
      </div>
    </>
  );
};

export default NewChatTab;
