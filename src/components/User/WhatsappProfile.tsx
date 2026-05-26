"use client";

import Image from "next/image";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { Camera, Pencil, Check, X } from "lucide-react";
import { capitalizeWords } from "@/lib/utils";
import { profileProps } from "@/lib/dummy";
import { useUpdateUserMutation } from "@/redux/Apis/User";

interface whatsappProfileProps {
  profile: profileProps;
  isUser: boolean;
  loading?: boolean;

  setOpen: Dispatch<SetStateAction<boolean>>
  onSave?: (data: whatsappProfileProps["profile"]) => void;
}

const WhatsappProfile = ({
  profile,
  loading = false,
  isUser = false,
  setOpen,
  onSave,
}: whatsappProfileProps) => {
  const [editField, setEditField] = useState<"name" | "bio" | "profile_pic" | null>(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(profile);
  const [file, setFile] = useState<string | null>(null)

  const [updateUser] = useUpdateUserMutation()

  // useEffect(() => {
  //   setFormData(profile);
  // }, [profile]);


  const uploadImage = async (file: File) => {
    try {
      const form = new FormData()
      form.append("image", file)
      const data = await fetch("/api/upload/simpleUpload", {
        method: "POST",

        body: form
      })

      const result = await data.json()

      console.log(result, "res ponse upload....")

      return result.fileUrl
    } catch (error) {

      return null
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files?.[0]) {
      const object = URL.createObjectURL(e.target.files?.[0])

      setFile(object)
      const url = await uploadImage(e.target.files?.[0])

      console.log(url, "url dataaa")
      setFormData({
        ...formData,
        [e.target.name]: url,
      });

      console.log(formData, "formdataaa in handle change")

    }
    else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleClick = () => {
    if (!fileInputRef.current) return
    fileInputRef.current?.click();
    setEditField('profile_pic')
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {

    try {
      console.log(formData, "formdataaaaaa.")
      await updateUser(formData).unwrap()
      setEditField(null);
    } catch (error) {

      console.log("got error in updation user.")
    }
    // onSave?.(formData);


  };

  return (
    <div className="w-full  md:max-w-[60%] min-h-screen bg-[#0b141a] text-white">
      {/* HEADER */}

      <div className="h-[60px] bg-[#202c33] flex justify-between items-center px-5 text-lg font-semibold">
        Profile

        <button onClick={() => setOpen(p => !p)} className="text-gray-400 px-2 rounded-md cursor-pointer bg-gray-700">X</button>
      </div>

      {/* PROFILE IMAGE */}

      <div className="flex flex-col items-center justify-center py-8 border-b border-white/5">
        <div className="relative w-44 h-44  overflow-hidden">
          <Image
            src={
              file || formData?.profile_pic ||
              "http://res.cloudinary.com/dwbxff6lk/image/upload/v1779544061/uploads/se83nguzt4k0buc0eocr.jpg"
            }
            alt="profile"
            fill
            unoptimized
            // height={200}
            // width={200}
            className="object-cover rounded-full"
          />

          <input name='profile_pic' onChange={handleChange} type='file' ref={fileInputRef}
            className="hidden" />


          <button onClick={handleClick} className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-wa-primary flex items-center justify-center ${isUser ? 'visible' : 'invisible'} `}>
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* PROFILE DETAILS */}

      <div className="max-w-2xl mx-auto">
        {/* NAME */}

        <div className="px-6 py-5 border-b border-white/5">
          <div className="text-[#00a884] text-sm mb-3">Your name</div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              name="name"
              disabled={editField !== "name"}
              value={formData?.name ?? ""}
              onChange={handleChange}
              className={`flex-1 bg-transparent outline-none text-[clamp(16px,4vw,16px)] ${editField === "name" ? "border-b border-[#00a884] pb-1" : ""
                }`}
            />

            {editField === "name" ? (
              <div className="flex items-center gap-2">
                <button disabled={loading} onClick={handleSave}>
                  <Check className="w-5 h-5 text-[#00a884]" />
                </button>

                <button onClick={() => setEditField(null)}>
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ) : (
              isUser ? (<button onClick={() => setEditField("name")}>
                <Pencil className="w-5 h-5 text-[#8696a0]" />
              </button>) : ("")
            )}
          </div>

          <p className="text-sm text-[#8696a0] mt-4">
            This is not your username or pin. This name will be visible to your
            contacts.
          </p>
        </div>

        <div className="px-6 py-5 border-b border-white/5">
          <div className="text-[#00a884] text-sm mb-3">Email</div>

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

        <div className="px-6 py-5 border-b border-white/5">
          <div className="text-[#00a884] text-sm mb-3">bio</div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              name="bio"
              disabled={editField !== "bio"}
              value={formData?.bio || ""}
              onChange={handleChange}
              className={`w-full bg-transparent outline-none break-words  text-[clamp(16px,4vw,16px)] ${editField === "bio" ? "border-b border-[#00a884] pb-1" : ""
                }`}
            />

            {editField === "bio" ? (
              <div className="flex items-center gap-2">
                <button disabled={loading} onClick={handleSave}>
                  <Check className="w-5 h-5 text-[#00a884]" />
                </button>

                <button onClick={() => setEditField(null)}>
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ) : (
              isUser ? (<button onClick={() => setEditField("bio")}>
                <Pencil className="w-5 h-5 text-[#8696a0]" />
              </button>) : ("")
            )}
          </div>
        </div>

        {/* PHONE */}

        <div className="px-6 py-5">
          <div className="text-wa-primary text-sm mb-3">Phone</div>

          <div className=" text-[clamp(16px,4vw,16px)]">{formData?.mobile}</div>
        </div>
      </div>


      <div className="w-full mt-4 flex justify-center-safe">

        <button onClick={handleSave} className={`bg-green-400 max-w-[150px] w-full mx-auto py-2 rounded-md text-center  ${editField ? "block" : 'invisible'} `}>
          Save
        </button>
      </div>
    </div>
  );
};

export default WhatsappProfile;
