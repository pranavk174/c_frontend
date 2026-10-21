"use client";

import React, {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { Send } from "lucide-react";
import Image from "next/image";

const MediaPreviewContent = ({
  file,
  onSend,
}: {
  file: File;

  onSend: (data: { file: File; caption: string }) => void;
}) => {
  const [caption, setCaption] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* image preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {previewUrl && (
          <Image
            priority
            src={previewUrl}
            alt="preview"
            height={400}
            width={400}
            className="max-h-full max-w-full object-contain rounded-2xl"
          />
        )}
      </div>

      {/* bottom */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 h-12 rounded-full bg-white/10 px-4 text-white outline-none placeholder:text-gray-400"
          />
          <button
            onClick={() => onSend({ file, caption })}
            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewContent;
