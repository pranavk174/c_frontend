import {
  Chat,
  Message,
  modalValue,
  selectedProp,
  socketResponse,
  valueProps,
} from "@/lib/dummy";
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
  Ban,
  Wallpaper,
} from "lucide-react";
import { Dispatch, memo, SetStateAction, useState } from "react";
import Modal from "../HOComponents/Modal";
import WhatsappProfile from "../User/WhatsappProfile";
import Image from "next/image";
import BlockUser from "../ModalChilds/Blockuser";
import Popups from "../HOComponents/Popups";

import ChatWallpaperSelector from "../Utility/Wallpapers";
import EditMessage from "./Editmessage";
import { useSocket } from "@/layouts/SocketWrapper";
import { useAppDispatch } from "@/lib/hooks";
import { chatApi } from "@/redux/Apis/Chat";
import { EDIT_MESSAGE } from "@/lib/events";

interface chatHeadProps {
  menu: boolean;
  setShowModal: Dispatch<SetStateAction<valueProps>>;
  chatDetails: Chat;
  selectedMessages?: number[];
  selected: selectedProp | null;
}

const Chathead = memo(
  ({
    menu,
    setShowModal,
    chatDetails,
    selectedMessages,
    selected,
  }: chatHeadProps) => {
    const [open, setOpen] = useState<valueProps>(modalValue);
    const [popup, setPopup] = useState<boolean>(false);
    const socket = useSocket();
    const dispatch = useAppDispatch();
    // const [editMessage, { isLoading }] = useEditMessageMutation();

    const handleSave = async (content: string) => {
      try {
        const patchResult = dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [chatDetails?.chat_id] },
            (draft) => {
              const items = draft?.data?.getChatById?.data?.items;

              if (!items) return;

              items.forEach((msg: Message) => {
                if (msg.id === selected?.id) {
                  msg.content = content;
                }
              });
            },
          ),
        );

        socket.emit(
          EDIT_MESSAGE,
          {
            content,
            message_ids: [selected?.id],
            chat_id: [chatDetails?.chat_id],
          },
          (res: socketResponse) => {
            console.log("socket response", res);
            if (!res.success) {
              patchResult.undo();
              throw new Error(res.message);
            }
          },
        );
      } catch (error) {
        console.log(error, "errror");
      } finally {
      }
    };

    const canEdit =
      selectedMessages?.length === 1 &&
      selected?.sender_id !== chatDetails?.user_id;
    return (
      <div className="relative">
        {menu ? (
          <header className="h-15 bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0 border-b border-wa-divider dark:border-wa-divider-dark z-10">
            <div className="flex items-center">
              <button className="mr-2 p-1  rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
                <ArrowLeft className="w-5 h-5 text-wa-icon " />
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
              <div className="w-px h-6 bg-wa-divider dark:bg-wa-divider-dark mx-1"></div>
              <button
                // onClick={deleteMessage}
                onClick={() =>
                  setShowModal({
                    type: "delete",
                    open: true,
                  })
                }
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <Trash className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setOpen({
                    open: true,
                    type: "edit",
                  });
                }}
                className={`p-2 rounded-full hover:bg-black/5 ${!canEdit ? "hidden invisible" : ""} dark:hover:bg-white/5 transition`}
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </header>
        ) : (
          <header className="h-15 bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0 border-b border-wa-divider dark:border-wa-divider-dark z-10">
            <div className="flex items-center">
              <Link
                href="/"
                className="md:hidden mr-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark" />
              </Link>

              <div
                onClick={() =>
                  setOpen({
                    type: "profile",
                    open: true,
                  })
                }
                className="w-10 h-10 rounded-full overflow-hidden cursor-pointer mr-4 shrink-0"
              >
                {chatDetails && chatDetails.profile_pic && (
                  <Image
                    priority
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
              <div className="w-px h-6 bg-wa-divider dark:bg-wa-divider-dark mx-1"></div>
              <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
                <Search className="w-5 h-5" />
              </button>
              <div>
                <button
                  onClick={() => setPopup((p) => !p)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                <Popups open={popup} setOpen={setPopup}>
                  <div className="bg-wa-header justify-center flex flex-col items-center text-center w-51.25 dark:bg-wa-header-dark rounded-md ">
                    <button
                      onClick={() => {
                        setOpen({
                          type: "block",
                          open: true,
                        });
                        setPopup(false);
                      }}
                      className={`p-2 flex w-full text-center  items-center justify-center  ${chatDetails?.blocked ? "hidden" : ""}  gap-2 text-[clamp(16px,4vw,16px)] hover:text-red-400 cursor-pointer  hover:bg-black/5 dark:hover:bg-white/5 transition`}
                    >
                      Block User <Ban className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setOpen({
                          type: "wallpaper",
                          open: true,
                        });
                        setPopup(false);
                      }}
                      className="p-2 flex w-51.25 items-center  justify-between text-[clamp(16px,4vw,16px)] hover:text-red-400 cursor-pointer  hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      Set Chat Wallpaper
                      <Wallpaper className="w-4 h-4" />
                    </button>
                  </div>
                </Popups>
              </div>
            </div>
          </header>
        )}

        <Modal values={open} setModal={setOpen}>
          {open.type === "profile" && (
            <WhatsappProfile
              setOpen={setOpen}
              isUser={false}
              profile={chatDetails}
            />
          )}
          {open.type === "wallpaper" && (
            <ChatWallpaperSelector setOpen={setOpen} modalValues={open} />
          )}

          {open.type === "edit" && selected && (
            <EditMessage
              initialMessage={selected}
              chatId={chatDetails.chat_id}
              onSave={(message) => {
                handleSave(message);
                setOpen({
                  type: null,
                  open: false,
                });
              }}
              onCancel={() => {}}
            />
          )}

          {open.type === "block" && (
            <BlockUser
              userId={chatDetails?.user_id}
              name={chatDetails?.name}
              chatId={chatDetails.chat_id}
              open={open}
              setOpen={setOpen}
            />
          )}
        </Modal>
        {/* <Modal open={block} values setModal={setBlock}>
        <BlockUser
          userId={chatDetails?.user_id}
          name={chatDetails?.name}
          chatId={chatDetails.chat_id}
          open={block}
          setOpen={setBlock}
        />
      </Modal> */}
      </div>
    );
  },
);

Chathead.displayName = "chathead";

export default Chathead;
