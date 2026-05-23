"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";

import { Camera, Pencil, Check, X } from "lucide-react";

interface ProfileProps {
  profile: {
    profile_pic?: string;
    name?: string;
    about?: string;
    phone?: string;
  };

  loading?: boolean;

  onSave?: (data: ProfileProps["profile"]) => void;
}

const WhatsappProfile = ({
  profile,
  loading = false,
  onSave,
}: ProfileProps) => {
  const [editField, setEditField] = useState<"name" | "about" | null>(null);

  // const [formData, setFormData] = useState(profile);

  // useEffect(() => {
  //   setFormData(profile);
  // }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setFormData({
    //   ...formData,
    //   [e.target.name]: e.target.value,
    // });
  };

  const handleSave = () => {
    onSave?.(formData);
    setEditField(null);
  };

  return (
    <div className="w-full max-w-[60%] min-h-screen bg-[#0b141a] text-white">
      {/* HEADER */}

      <div className="h-[60px] bg-[#202c33] flex items-center px-5 text-lg font-semibold">
        Profile
      </div>

      {/* PROFILE IMAGE */}

      <div className="flex flex-col items-center justify-center py-8 border-b border-white/5">
        <div className="relative w-44 h-44 rounded-full overflow-hidden">
          <Image
            src={
              profile?.profile_pic ||
              "http://res.cloudinary.com/dwbxff6lk/image/upload/v1779544061/uploads/se83nguzt4k0buc0eocr.jpg"
            }
            alt="profile"
            fill
            unoptimized
            // height={200}
            // width={200}
            className="object-cover"
          />

          <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
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
              value={profile?.name || ""}
              onChange={handleChange}
              className={`flex-1 bg-transparent outline-none text-[17px] ${
                editField === "name" ? "border-b border-[#00a884] pb-1" : ""
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
              <button onClick={() => setEditField("name")}>
                <Pencil className="w-5 h-5 text-[#8696a0]" />
              </button>
            )}
          </div>

          <p className="text-sm text-[#8696a0] mt-4">
            This is not your username or pin. This name will be visible to your
            contacts.
          </p>
        </div>

        {/* ABOUT */}

        <div className="px-6 py-5 border-b border-white/5">
          <div className="text-[#00a884] text-sm mb-3">About</div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              name="about"
              disabled={editField !== "about"}
              value={profile?.about || ""}
              onChange={handleChange}
              className={`flex-1 bg-transparent outline-none text-[17px] ${
                editField === "about" ? "border-b border-[#00a884] pb-1" : ""
              }`}
            />

            {editField === "about" ? (
              <div className="flex items-center gap-2">
                <button disabled={loading} onClick={handleSave}>
                  <Check className="w-5 h-5 text-[#00a884]" />
                </button>

                <button onClick={() => setEditField(null)}>
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditField("about")}>
                <Pencil className="w-5 h-5 text-[#8696a0]" />
              </button>
            )}
          </div>
        </div>

        {/* PHONE */}

        <div className="px-6 py-5">
          <div className="text-[#00a884] text-sm mb-3">Phone</div>

          <div className="text-[17px]">{profile?.phone}</div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappProfile;
