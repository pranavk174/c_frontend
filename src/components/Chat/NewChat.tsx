"use client";

import { useNewChatMutation } from "@/redux/Apis/Chat";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    name: string;
    username: string;
    profile_pic?: string;
}

interface NewChatProps {
    users: User[];
    // onSelectUser: (user: User) => void;
}

export default function NewChat({
    users,
    // onSelectUser,
}: NewChatProps) {

    const [newChat] = useNewChatMutation()

    const router = useRouter()

    const handleCreate = async (member_id: number) => {


        try {

            const data = await newChat({ member_id }).unwrap()

            if (data.data.createNewChat.data.chat_id) {

                router.push('/chat)

            }
        } catch (error) {
            console.log(error, "error in creating chat...")

        }
    }



    return (
        <div className="h-[50vh] w-full max-w-[80%]  bg-[#111b21] flex flex-col">
            {/* Header */}
            <div className="bg-[#202c33] px-4 py-4 border-b border-[#2a3942]">
                <h2 className="text-xl font-semibold text-white">
                    New Chat
                </h2>
            </div>

            {/* Search */}
            <div className="bg-[#111b21] p-3 border-b border-[#2a3942]">
                <input
                    type="text"
                    placeholder="Search name..."
                    className="w-full bg-[#202c33] text-white placeholder:text-gray-400 rounded-lg px-4 py-2 outline-none"
                />
            </div>

            {/* Users */}
            <div className="flex-1 overflow-y-auto">
                {users.map((user) => (
                    <button
                        key={user.id}
                        onClick={() => handleCreate(user.id)}
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
                            <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold">
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