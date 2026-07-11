"use client";

import Image from "next/image";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";

import { Camera, Pencil, Check, X, Ban } from "lucide-react";

import { profileProps, socketResponse, valueProps } from "@/lib/dummy";
import SoundToggle from "../Utility/Togglebuton";
import {
  useUnBlockUserMutation,
  useUpdatePreferenceMutation,
  useUpdateUserMutation,
} from "@/redux/Apis/Users";
import { useSocket } from "@/layouts/SocketWrapper";
import { CHAT_JOINED } from "@/lib/events";

import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { uploadImage } from "@/lib/utils";
import Uploader from "../Utility/Uploader";
import { useSearchParams } from "next/navigation";

interface whatsappProfileProps {
  profile: profileProps;
  isUser: boolean;
  loading?: boolean;

  setOpen: Dispatch<SetStateAction<valueProps>>;
  onSave?: (data: whatsappProfileProps["profile"]) => void;
}

const WhatsappProfile = ({
  profile,
  loading = false,
  isUser = false,
  setOpen,
  onSave,
}: whatsappProfileProps) => {
  const [editField, setEditField] = useState<
    "name" | "bio" | "profile_pic" | "cover_pic" | null
  >(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const [formData, setFormData] = useState(profile);

  const { chatSocket: socket, notificationSocket } = useSocket();
  const [updateUser] = useUpdateUserMutation();
  const [unBlockUser] = useUnBlockUserMutation();
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const pathname = useSearchParams();
  const chat_type = pathname.get("chat_type");

  // useEffect(() => {
  //   setFormData(profile);
  // }, [profile]);

  // const uploadImage = async (file: File) => {
  //   try {
  //     const form = new FormData();
  //     form.append("image", file);
  //     const data = await fetch("/api/upload/simpleUpload", {
  //       method: "POST",

  //       body: form,
  //     });

  //     const result = await data.json();

  //     console.log(result, "res ponse upload....");

  //     return result.fileUrl;
  //   } catch (error) {
  //     return null;
  //   }
  // };

  console.log(profile, "profile dataaaaa....");
  const handleSave = async () => {
    try {
      console.log(formData, "formdataaaaaa.");
      await updateUser(formData).unwrap();
      setEditField(null);
    } catch (error) {
      console.log("got error in updation user.");
    }
    // onSave?.(formData);
  };


  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked } = e.target;
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUnblock = async () => {
    try {
      await unBlockUser({ user_id: profile?.user_id });
      socket.emit(
        CHAT_JOINED,
        { chat_id: formData?.chat_id, user_id },
        (response: socketResponse) => {
          console.log("user joined ", response);
        },
      );
    } catch (error) {
      console.log(error, "error in unblocking...");
    }
  };

  return (
    <div className="w-full   md:max-w-[60%] min-h-screen bg-[#0b141a] text-white">
      {/* HEADER */}

      {/* PROFILE IMAGE */}

      <div className="flex flex-col items-center justify-center border-b border-white/5">
        <div className="relative h-[220px] w-full">
          <div className="h-[60px] relative z-1  bg-transparent flex justify-between items-center px-5 text-lg font-semibold">
            Profile
            <button
              onClick={() =>
                setOpen({
                  type: "null",
                  open: false,
                })
              }
              className="text-gray-400 px-2 rounded-md cursor-pointer bg-gray-700"
            >
              X
            </button>
          </div>

          <Uploader
            setEditField={setEditField}
            editField={editField}
            isUser={isUser}
            cover_pic={formData?.cover_pic}
            profile_pic={formData?.profile_pic}
            setFormData={setFormData}
            formData={formData}
          />
        </div>
        <div className="h-40" />
      </div>

      {/* PROFILE DETAILS */}

      <div className="max-w-4xl mx-auto">
        {/* NAME */}

        <div className="px-6 py-5 border-b border-white/5">
          <div className="text-wa-primary text-sm mb-3">Your name</div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              name="name"
              disabled={editField !== "name"}
              value={formData?.name ?? ""}
              onChange={handleChange}
              className={`flex-1 bg-transparent outline-none text-[clamp(16px,4vw,16px)] ${editField === "name" ? "border-b border-wa-primary pb-1" : ""
                }`}
            />

            {editField === "name" ? (
              <div className="flex items-center gap-2">
                <button disabled={loading} onClick={handleSave}>
                  <Check className="w-5 h-5 text-wa-primary" />
                </button>

                <button onClick={() => setEditField(null)}>
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ) : isUser ? (
              <button onClick={() => setEditField("name")}>
                <Pencil className="w-5 h-5 text-[#8696a0]" />
              </button>
            ) : (
              ""
            )}
          </div>

          <p className="text-sm text-[#8696a0] mt-4">
            This is not your username or pin. This name will be visible to your
            contacts.
          </p>
        </div>

        <div className="px-6 py-5 border-b border-white/5">
          <div className="text-wa-primary text-sm mb-3">Email</div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              name="email"
              disabled={true}
              value={formData?.email || ""}
              onChange={handleChange}
              className={`flex-1 bg-transparent outline-none  text-[clamp(16px,4vw,16px)] `}
            />
          </div>
        </div>

        {/* bio */}

        {formData?.bio && formData?.bio?.length > 0 && (
          <div className="px-6 py-5 border-b border-white/5">
            <div className="text-wa-primary text-sm mb-3">bio</div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                name="bio"
                disabled={editField !== "bio"}
                value={formData?.bio || ""}
                onChange={handleChange}
                className={`w-full bg-transparent outline-none wrap-break-word  text-[clamp(16px,4vw,16px)] ${editField === "bio" ? "border-b border-wa-primary pb-1" : ""
                  }`}
              />

              {editField === "bio" ? (
                <div className="flex items-center gap-2">
                  <button disabled={loading} onClick={handleSave}>
                    <Check className="w-5 h-5 text-wa-primary" />
                  </button>

                  <button onClick={() => setEditField(null)}>
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              ) : isUser ? (
                <button onClick={() => setEditField("bio")}>
                  <Pencil className="w-5 h-5 text-[#8696a0]" />
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        )}

        {/* PHONE */}

        <div className="px-6 py-5">
          <div className="text-wa-primary text-sm mb-3">Phone</div>

          <div className=" text-[clamp(16px,4vw,16px)]">{formData?.mobile}</div>
        </div>

        <div
          className={`px-6 py-5 ${isUser || chat_type !== "group" ? "" : "hidden invisisble"
            }`}
        >
          <div className="text-wa-primary text-sm mb-3">Theme</div>

          <div className={` transform-content rotate-180 text-[clamp(16px,4vw,16px)]`}>

          </div>
        </div>
      </div>

      <div
        className={`w-full ${chat_type === "group" ? "hidden invisible" : ""} mt-4 flex justify-center-safe`}
      >
        <button
          onClick={handleSave}
          className={`bg-green-400 max-w-[150px] w-full mx-auto py-2 rounded-md text-center  ${editField ? "block" : "invisible hidden"} `}
        >
          Save
        </button>
        <button
          onClick={handleUnblock}
          className={`p-2 flex  items-center max-w-[150px] w-full mx-auto py-2 rounded-md text-center justify-between text-[clamp(16px,4vw,16px)]  ${formData?.blocked ? "block" : "invisible hidden"} text-red-400 cursor-pointer  hover:bg-black/5 dark:hover:bg-white/5 transition`}
        >
          Unblock User <Ban className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default WhatsappProfile;
