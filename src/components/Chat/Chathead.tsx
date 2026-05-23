import { Chat } from "@/lib/dummy";
import { menu } from "framer-motion/client";
import {
  ArrowLeft,
  CornerUpLeft,
  CornerUpRight,
  Info,
  Link,
  MoreVertical,
  Phone,
  Search,
  Trash,
  Video,
} from "lucide-react";
import React, { Dispatch, memo, SetStateAction, useState } from "react";
import Modal from "../HOComponents/Modal";
import WhatsappProfile from "../User/WhatsappProfile";
import Image from "next/image";
interface chatHeadProps {
  menu: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  chatDetails: Chat;
}

const Chathead = memo(({ menu, setShowModal, chatDetails }: chatHeadProps) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      {menu ? (
        <header className="h-[60px] bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0 border-b border-wa-divider dark:border-wa-divider-dark z-10">
          <div className="flex items-center">
            <button className="mr-2 p-1  rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <ArrowLeft className="w-5 h-5 text-wa-icon text-black" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer mr-4 shrink-0"></div>
            <div className="flex flex-col cursor-pointer"></div>
          </div>
          <div className="flex items-center space-x-4 text-wa-icon dark:text-wa-icon-dark">
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition hidden sm:block">
              <CornerUpLeft className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <CornerUpRight className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-6 bg-wa-divider dark:bg-wa-divider-dark mx-1"></div>
            <button
              // onClick={deleteMessage}
              onClick={() => setShowModal(true)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <Trash className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>
      ) : (
        <header className="h-[60px] bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0 border-b border-wa-divider dark:border-wa-divider-dark z-10">
          <div className="flex items-center">
            <Link
              href="/"
              className="md:hidden mr-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <ArrowLeft className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark" />
            </Link>

            <div
              onClick={() => setOpen((p) => !p)}
              className="w-10 h-10 rounded-full overflow-hidden cursor-pointer mr-4 shrink-0"
            >
              {chatDetails.profile_pic && (
                <Image
                  height={100}
                  width={100}
                  src={chatDetails?.profile_pic}
                  alt={chatDetails?.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col cursor-pointer">
              <h2 className="text-base  font-normal text-gray-900 dark:text-gray-100">
                {chatDetails?.name}
              </h2>
              {/* {chat.isOnline ? (
              <span className="text-xs text-wa-icon dark:text-wa-icon-dark">online</span>
            ) : (
              <span className="text-xs text-wa-icon dark:text-wa-icon-dark">click here for contact info</span>
            )} */}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-wa-icon dark:text-wa-icon-dark">
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition hidden sm:block">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <Phone className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-6 bg-wa-divider dark:bg-wa-divider-dark mx-1"></div>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <Modal open={open} setOpen={setOpen}>
        <WhatsappProfile profile={chatDetails} />
      </Modal>
    </>
  );
});

Chathead.displayName = "chathead";

export default Chathead;
