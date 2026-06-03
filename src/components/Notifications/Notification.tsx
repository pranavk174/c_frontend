import { Notification } from "@/lib/dummy";
import { useGetNotificationsQuery } from "@/redux/Apis/Notification";
import { div } from "framer-motion/client";
import Image from "next/image";

const notifications = [
    {
        id: 1,
        type: "message",
        name: "Aman Sharma",
        message: "Bhai kal meeting kitne baje hai?",
        time: "2m",
        avatar: "https://i.pravatar.cc/100?img=12",
        color: "#25D366",
    },
    {
        id: 2,
        type: "story_like",
        name: "Priya",
        message: "liked your story ❤️",
        time: "5m",
        avatar: "https://i.pravatar.cc/100?img=22",
        color: "#ff4d6d",
    },
    {
        id: 3,
        type: "post_like",
        name: "Rahul Verma",
        message: "liked your photo 👍",
        time: "8m",
        avatar: "https://i.pravatar.cc/100?img=33",
        color: "#4f46e5",
    },
    {
        id: 4,
        type: "follow",
        name: "Neha Kapoor",
        message: "started following you",
        time: "12m",
        avatar: "https://i.pravatar.cc/100?img=45",
        color: "#06b6d4",
    },
    {
        id: 5,
        type: "mention",
        name: "Karan",
        message: "mentioned you in a comment",
        time: "20m",
        avatar: "https://i.pravatar.cc/100?img=55",
        color: "#f59e0b",
    },
];

export default function NotificationUI({ notifications }: { notifications: Notification }) {




    console.log(notifications, "notofcationssss")


    return (
        <div className=" ">
            <div className="w-full  space-y-3 h-[70vh] overflow-y-auto hide-scrollbar">
                {Array.isArray(notifications) && notifications?.map((item: Notification) => (
                    <div
                        key={item.notification_id}
                        className="
            bg-[#111B21]
            border border-white/10
            rounded-2xl
            p-4
            shadow-xl
            hover:scale-[1.01]
            transition-all
            duration-300
            cursor-pointer
          "
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="relative">
                                <Image
                                    height={100}
                                    width={100}
                                    src={item.profile_pic}
                                    alt="profile"
                                    className="w-14 h-14 rounded-full object-cover"
                                />

                                <span
                                    className="
                  absolute
                  bottom-0
                  right-0
                  w-4
                  h-4
                  rounded-full
                  border-2 border-[#111B21]
                "
                                    style={{
                                        background: item.color,
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-semibold text-sm">
                                        {item.name}
                                    </h3>

                                    <span className="text-xs text-gray-400">
                                        {item.time}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-300 mt-1">
                                    {item.message}
                                </p>

                                {/* Type Badge */}
                                <div className="mt-3">
                                    <span
                                        className="
                    text-[11px]
                    px-3
                    py-1
                    rounded-full
                    text-white
                    font-medium
                  "
                                        style={{
                                            background: item.color,
                                        }}
                                    >
                                        {item.notification_type.replace("_", " ")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}