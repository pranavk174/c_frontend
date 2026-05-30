"use client";

import { uploadImage } from "@/lib/utils";
import { useCreateStoryMutation } from "@/redux/Apis/Story";
import Image from "next/image";
import { Dispatch, SetStateAction, useMemo, useState } from "react";

interface PreviewProps {
  files: File[];
  setOpen: Dispatch<SetStateAction<boolean>>;
  setModal: Dispatch<SetStateAction<"storyupload" | "storypreview" | null>>;
}

export default function WhatsAppStoryPreview({
  files,
  setOpen,
  setModal,
}: PreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textData, setTextData] = useState<string>("");
  const [createStory] = useCreateStoryMutation();
  // File -> Preview URL
  const previewFiles = useMemo(() => {
    return files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
  }, [files]);

  const currentFile = previewFiles[currentIndex];

  const nextSlide = () => {
    if (currentIndex < previewFiles.length - 1) {
      setCurrentIndex((p) => p + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((p) => p - 1);
    }
  };

  const handleCreateStory = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const urls = await Promise.all(
        files.map((file) => {
          return uploadImage(file);
        }),
      );
      console.log(urls, "urls dataaaaa.a...............");
      if (urls.length === files.length) {
        await Promise.all(
          urls.map((url) => {
            return createStory({ text_data: textData, content: url }).unwrap();
          }),
        );

        setOpen(false);
        setModal(null);
        // await createStory({ text_data: textData, content: "" }).unwrap();
      }
    } catch (error) {
      console.log("error in creating story", error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[92vh] bg-wa-bg-dark rounded-3xl overflow-hidden relative shadow-2xl border border-wa-search-input-dark flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-[#202c33] border-b border-wa-search-input-dark">
          <div className="flex items-center gap-3">
            <button className="text-white text-2xl">×</button>

            <div>
              <h2 className="text-white text-sm font-medium">Preview</h2>

              <p className="text-[#8696a0] text-xs">Create story</p>
            </div>
          </div>

          <button className="text-wa-primary text-sm font-medium">Done</button>
        </div>

        {/* Story Area */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {/* Image */}
          {currentFile && (
            <Image
              priority
              src={currentFile.preview}
              alt="preview"
              fill
              unoptimized
              className="object-cover"
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

          {/* Progress */}
          <div className="absolute top-3 left-3 right-3 flex gap-1">
            {previewFiles.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all ${
                    i <= currentIndex ? "w-full" : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-3xl z-20"
          >
            ‹
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-3xl z-20"
          >
            ›
          </button>

          {/* Bottom thumbnails */}
          <div className="absolute bottom-4 left-0 right-0 flex gap-2 overflow-x-auto px-4">
            {previewFiles.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative min-w-15 h-22.5 rounded-xl overflow-hidden border-2 ${
                  currentIndex === index
                    ? "border-wa-primary"
                    : "border-transparent"
                }`}
              >
                <Image
                  priority
                  src={item.preview}
                  alt="thumb"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#202c33] px-4 py-4 border-t border-wa-search-input-dark">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-wa-search-input-dark rounded-full px-4 py-3">
              <input
                type="text"
                placeholder="Add a caption..."
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                className="w-full bg-transparent outline-none text-white placeholder:text-[#8696a0]"
              />
            </div>

            <button
              onClick={handleCreateStory}
              className="w-14 h-14 rounded-full bg-wa-primary flex items-center justify-center text-black text-2xl"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
