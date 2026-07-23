import React, { useState } from 'react'
import UserCard from '../User/UserCard';
import { logger } from '@/lib/utils';
import { Chat, User, valueProps } from '@/lib/dummy';
import { ArrowLeft } from 'lucide-react';
import { useForwardMessageMutation, useGetAllChatsQuery } from '@/redux/Apis/Chat';
import { useFormStatus } from 'react-dom';
import { useSocket } from '@/layouts/SocketWrapper';
interface formProps {

    reciever_ids: number[];
    chat_ids: number[];

}

interface ListProps {
    users: User[]
    open: valueProps;
    selectedMessages?: number[];
    setOpen: React.Dispatch<React.SetStateAction<valueProps>>
}
const UserList = ({ users, open, selectedMessages, setOpen }: ListProps) => {

    const [forwardMessage, { isLoading, isSuccess }] = useForwardMessageMutation()
    const socket = useSocket()
    const { data } = useGetAllChatsQuery(
        {},
        {
            selectFromResult: ({ data, isLoading, isSuccess }) => {


                const result = data?.data?.getAllChats?.data?.items?.filter((chat: Chat) => {
                    // Return false for groups or invalid chats
                    return chat.chat_type === 'group'
                });

                const da = [...users, ...result]

                logger.debug(da, "useerrrr");


                return {
                    data: da,
                    isLoading,
                    isSuccess,
                };
            },
        },
    );

    const [formData, setFormData] = useState<formProps>({

        reciever_ids: [],
        chat_ids: [],

    });

    const handleForward = async () => {
        try {
            if (selectedMessages && selectedMessages.length > 0) {
                await forwardMessage({ message_ids: selectedMessages, chat_ids: formData.chat_ids, reciever_ids: formData.reciever_ids }).unwrap()
            }
            setOpen({ open: false, type: null })
        } catch (error) {

        }
    }



    logger.log(formData, "formdataa");

    return (
        <div className='bg-[#202c33] p-3 rounded-xl'>
            <div className="bg-[#202c33] px-4 py-4 border-b border-wa-search-input-dark">
                <h2 className="text-xl font-semibold text-white">Forward Message</h2>
            </div>
            <div className="bg-wa-bg-dark p-3 border-b border-wa-search-input-dark">
                <input
                    type="text"
                    placeholder="Search name..."
                    className="w-full bg-[#202c33] text-white placeholder:text-gray-400 rounded-lg px-4 py-2 outline-none"
                />
            </div>
            <div className="h-[250px] overflow-y-auto">
                {data?.length === 0 ? (
                    <div>
                        <div className="flex   flex-1 justify-center items-center ">
                            <h3 className="font-bold text-white text-[clamp(16px,50vw,17px)]">
                                No New Users Found
                            </h3>
                        </div>
                    </div>
                ) : (
                    data?.map((user: User) => (
                        <UserCard
                            onClick={(value) => {
                                setFormData((prev) => {
                                    if (user.chat_id !== null) {
                                        if (value) {
                                            return {
                                                ...prev,
                                                chat_ids: [...prev.chat_ids, user.chat_id],
                                            };
                                        }

                                        return {
                                            ...prev,
                                            chat_ids: prev.chat_ids.filter((id) => id !== user.chat_id),
                                        };
                                    } else {
                                        if (value) {
                                            return {
                                                ...prev,
                                                reciever_ids: [...prev.reciever_ids, user.id],
                                            };
                                        }

                                        return {
                                            ...prev,
                                            reciever_ids: prev.reciever_ids.filter((id) => id !== user.id),
                                        };
                                    }
                                });


                            }}
                            selectedUser={formData.reciever_ids.includes(user.id) || formData.chat_ids?.includes(user.chat_id as number)}
                            key={user.id ?? user.chat_id}
                            user={user}
                            type={"group"}
                        />
                    ))
                )}
            </div>
            <div className="flex gap-x-3 justify-center gap-2">

                <button
                    type="submit"
                    onClick={handleForward}
                    disabled={formData.reciever_ids.length === 0 && formData.chat_ids?.length === 0}
                    className="  w-full bg-wa-primary  block max-w-[150px] hover:bg-wa-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-1 rounded transition-colors"
                >
                    {/* {isLoading ? "Creating Group...." : "Create Group"} */}
                    {true ? "Next" : "Create Group"}
                </button>
            </div>
        </div>
    )
}

export default UserList