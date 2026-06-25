"use client";

import { valueProps } from "@/lib/dummy";

import { useNewChatMutation } from "@/redux/Apis/Chat";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

interface User {
    id: number;
    name: string;
    chat_id: number | null
    username: string;
    profile_pic?: string;
}

interface NewChatProps {
    users: User[];
    setModal: Dispatch<SetStateAction<valueProps>>
    // onSelectUser: (user: User) => void;
}

export default function NewChat({
    users,
    setModal
    // onSelectUser,
}: NewChatProps) {

    const [newChat] = useNewChatMutation()

    const router = useRouter()

    const handleCreate = async (member_id: number, chat_id: number | null = null) => {
        try {
            if (chat_id !== null) {
                router.push(`/chat/${chat_id}?chat_type=private`)
                console.log("ye chat dataaaa")


            } else {



                const data = await newChat({ member_id }).unwrap()

                if (data.data.createNewChat.data.chat_id) {

                    console.log(data.data.createNewChat.data.chat_id, "chat idddd")
                    router.push(`/chat/${data.data.createNewChat.data.chat_id}?chat_type=private`)

                }
            }
            return
        } catch (error) {
            console.log(error, "error in creating chat...")


        }
        finally {
            setModal({
                open: false,
                type: null
            })

        }
    }




    return (
        <div className="h-[50vh] w-full max-w-[80%]  bg-wa-bg-dark flex flex-col">
            {/* Header */}
            <div className="bg-[#202c33] px-4 py-4 border-b border-wa-search-input-dark">
                <h2 className="text-xl font-semibold text-white">
                    New Chat
                </h2>
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



                {users.length === 0 ? (<div>

                    <div className="flex   flex-1 justify-center items-center ">

                        <h3 className="font-bold text-white text-[clamp(16px,50vw,17px)]">
                            No New Users Found
                        </h3>

                    </div>

                </div>) : users.map((user) => (
                    <button
                        key={user.id}
                        onClick={() => handleCreate(user.id, user.chat_id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors border-b border-[#182229]"
                    >
                        {/* Avatar */}
                        {user.profile_pic ? (
                            <Image
                                height={100}
                                width={100}
                                src={user.profile_pic}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-wa-primary flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* User Details */}
                        <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-white font-medium truncate">
                                {user.name}
                            </span>

                            <span className="text-sm text-gray-400 truncate">
                                @{user.username}
                            </span>
                        </div>

                        {/* Online Dot */}
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </button>
                ))}
            </div>
        </div>
    );
}