import React, {
  Dispatch,
  DispatchWithoutAction,
  SetStateAction,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { uploadImage } from "@/lib/utils";
import { Camera } from "lucide-react";
import { profileProps, valueProps } from "@/lib/dummy";
type UploadableForm = {
  profile_pic?: string | null;
  cover_pic?: string | null;
};

interface UploaderProps<T extends UploadableForm> {
  isUser?: boolean;
  cover_pic?: string | null;
  profile_pic?: string | null;

  formData: T;
  editField?: "name" | "bio" | "profile_pic" | "cover_pic" | null;

  setEditField?: React.Dispatch<
    React.SetStateAction<"name" | "bio" | "profile_pic" | "cover_pic" | null>
  >;

  setFormData: React.Dispatch<React.SetStateAction<T>>;
}
const Uploader = <T extends UploadableForm>({
  editField,
  setEditField,
  isUser,
  cover_pic,
  profile_pic,
  setFormData,
  formData,
}: UploaderProps<T>) => {
  const [file, setFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const object = URL.createObjectURL(e.target.files?.[0]);

      setFile(object);
      const url = await uploadImage(e.target.files?.[0]);

      console.log(url, "url dataaa");
      setFormData({
        ...formData,
        [e.target.name]: url,
      });
    }
  };

  const handleClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current?.click();
    setEditField?.("profile_pic");
  };

  const handleCoverClick = () => {
    if (!fileInputRef.current) return;
    coverInputRef.current?.click();
    setEditField?.("cover_pic");
  };

  return (
    <>
      <Image
        priority
        alt="cover_pic"
        fill
        className="object-cover"
        unoptimized
        src={
          cover_pic ||
          "http://res.cloudinary.com/dwbxff6lk/image/upload/v1779544061/uploads/se83nguzt4k0buc0eocr.jpg"
        }
      />
      <div className="relative w-44 h-44 mx-auto -bottom-[30%] overflow-hidden">
        <Image
          priority
          src={
            file ||
            profile_pic ||
            "http://res.cloudinary.com/dwbxff6lk/image/upload/v1779544061/uploads/se83nguzt4k0buc0eocr.jpg"
          }
          alt="profile"
          fill
          unoptimized
          // height={200}
          // width={200}
          className="object-cover rounded-full"
        />

        <input
          name="profile_pic"
          onChange={handleChange}
          type="file"
          ref={fileInputRef}
          className="hidden"
        />

        <button
          onClick={handleClick}
          className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-wa-primary flex items-center justify-center ${isUser ? "visible" : "invisible"} `}
        >
          <Camera className="w-5 h-5 text-white" />
        </button>
      </div>

      {isUser && (
        <div>
          <button
            onClick={handleCoverClick}
            className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>

          <input
            name="cover_pic"
            onChange={handleChange}
            type="file"
            ref={coverInputRef}
            className="hidden"
          />
        </div>
      )}
    </>
  );
};

export default Uploader;
