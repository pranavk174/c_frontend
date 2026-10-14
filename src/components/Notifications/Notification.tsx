import { Notification, socketResponse } from "@/lib/dummy";

import { useSeenNotificationMutation } from "@/redux/Apis/Notification";

import Image from "next/image";
import { logger } from "@/lib/utils";
import { useEffect } from "react";
import { useSocket } from "@/layouts/SocketWrapper";
import { SEEN_NOTIFICATION } from "@/lib/events";

export default function NotificationUI({
  notifications,
}: {
  notifications: Notification;
}) {
  const { notificationSocket } = useSocket();

  const [seenNotification] = useSeenNotificationMutation();

  useEffect(() => {
    return () => {
      if (Array.isArray(notifications) && notifications.length > 0) {
        const notification_ids = notifications.map(
          (item: Notification) => item.notification_id,
        );
        try {
          logger.debug("unmounted");
          notificationSocket.emit(
            SEEN_NOTIFICATION,
            { notification_ids },
            (response: socketResponse) => {
              console.log("notifications een successfully....", response);
            },
          );
        } catch (error) {
          console.log(error);
        }
      }
    };
  }, [notifications, seenNotification, notificationSocket]);

  logger.log(notifications, "notofcationssss");

  return (
    <div className=" ">
      <div className="w-full  space-y-3 h-[70vh] overflow-y-auto hide-scrollbar">
        {Array.isArray(notifications) &&
          notifications?.map((item: Notification) => (
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
                {item?.profile_pic && (
                  <div className="relative">
                    <Image
                      height={100}
                      width={100}
                      src={
                        item?.profile_pic.length > 0
                          ? item.profile_pic
                          : "https://i.pravatar.cc/100?img=55"
                      }
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
                )}{" "}
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm">
                      {item.name}
                    </h3>

                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>

                  <p className="text-sm text-gray-300 mt-1">{item.message}</p>

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
