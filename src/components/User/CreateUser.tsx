"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";

import { uploadImage } from "@/lib/utils";
import { useCreateUserMutation } from "@/redux/Apis/Users";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils";


interface UserProfileProps {
  profile?: {
    fname: string;
    lname: string;
    user_name: string;
    email: string;
    bio?: string;
    mobile: string;
    profile_pic?: string;
    cover_pic?: string;
  };
  email: string;
}

export default function UserProfile({ profile, email }: UserProfileProps) {
  const [createUser, { isLoading }] = useCreateUserMutation();

  const router = useRouter();
  const profileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fname: profile?.fname || "",
    lname: profile?.lname || "",
    user_name: profile?.user_name || "",
    email: email,
    bio: profile?.bio || "",
    mobile: profile?.mobile || "",
    profile_pic:
      profile?.profile_pic ||
      "http://res.cloudinary.com/dwbxff6lk/image/upload/v1779544061/uploads/se83nguzt4k0buc0eocr.jpg",
    cover_pic:
      profile?.cover_pic ||
      "http://res.cloudinary.com/dwbxff6lk/image/upload/v1779544061/uploads/se83nguzt4k0buc0eocr.jpg",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const url = await uploadImage(file);

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: url,
    }));
  };

  const handleSave = async () => {
    try {
      const data = await createUser({ formData }).unwrap();
      logger.debug(data.errors[0].extensions.code, "data in create user")
      if (data.errors[0].extensions.code === "REGISTER_ERROR") {
        router.back()

      } else {
        // router.replace("/");
      }
      // router.replace("/");
    } catch (err) {
      logger.log(err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#0b141a] min-h-screen text-white">
      {/* Cover */}

      <div className="relative h-64">
        <Image
          src={formData.cover_pic || "/default-cover.jpg"}
          alt="cover"
          fill
          className="object-cover"
          unoptimized
        />

        <button
          onClick={() => coverRef.current?.click()}
          className="absolute right-4 bottom-4 bg-black/50 p-3 rounded-full"
        >
          <Camera size={18} />
        </button>

        <input
          ref={coverRef}
          type="file"
          name="cover_pic"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Profile */}

        <div className="absolute left-1/2 -bottom-16 -translate-x-1/2">
          <div className="relative w-36 h-36">
            <Image
              src={formData.profile_pic || "/default-avatar.png"}
              alt="profile"
              fill
              className="rounded-full object-cover border-4 border-[#0b141a]"
              unoptimized
            />

            <button
              onClick={() => profileRef.current?.click()}
              className="absolute right-0 bottom-0 bg-wa-primary p-2 rounded-full"
            >
              <Camera size={16} />
            </button>

            <input
              ref={profileRef}
              type="file"
              name="profile_pic"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>
      </div>

      <div className="pt-24 px-6 space-y-5">
        <input
          name="fname"
          value={formData.fname}
          onChange={handleChange}
          placeholder="First Name"
          className="w-full bg-[#202c33] p-3 rounded-lg"
        />

        <input
          name="lname"
          value={formData.lname}
          onChange={handleChange}
          placeholder="Last Name"
          className="w-full bg-[#202c33] p-3 rounded-lg"
        />

        <input
          name="user_name"
          value={formData.user_name}
          onChange={handleChange}
          placeholder="Username"
          className="w-full bg-[#202c33] p-3 rounded-lg"
        />

        <input
          name="email"
          value={formData.email}
          disabled
          className="w-full bg-[#202c33] p-3 rounded-lg opacity-70"
        />

        <input
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="Mobile"
          className="w-full bg-[#202c33] p-3 rounded-lg"
        />

        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Bio"
          rows={4}
          className="w-full bg-[#202c33] p-3 rounded-lg"
        />

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-wa-primary text-black font-semibold py-3 rounded-lg"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
