"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StoryItem, UserStories } from "@/lib/dummy";

// interface StoryItem {
//   id: number;
//   url: string;
//   seen?: boolean;
// }

interface StoryViewerProps {
  stories: UserStories;
  initialIndex?: number;
  onClose?: () => void;
}

const STORY_DURATION = 5000;

const StoryViewer = ({
  stories,
  initialIndex = 0,
  onClose,
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  // Keep onClose in a ref so the effect never needs it as a dependency
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const currentStory = stories.stories[currentIndex];

  console.log(stories, "store dataaaa", currentStory)

  // Story Progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;

        // Move to next story
        if (next >= 100) {
          if (currentIndex < stories.stories.length - 1) {
            setCurrentIndex((p) => p + 1);
            return 0;
          }

          // Close viewer safely
          setTimeout(() => {
            onCloseRef.current?.();
          }, 0);

          return 100;
        }

        return next;
      });
    }, STORY_DURATION / 50);

    return () => clearInterval(interval);
  }, [currentIndex, stories.stories.length]);

  // Previous Story
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  // Next Story
  const handleNext = () => {
    if (currentIndex < stories.stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose?.();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Top Overlay */}
      <div className="absolute top-0 left-0 z-50 w-full p-4">
        {/* Progress Bars */}
        <div className="flex gap-1 mb-4">
          {stories.stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    index < currentIndex
                      ? "100%"
                      : index === currentIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image priority
              src={stories.profile_pic ?? ""}
              alt="profile"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div>
              <h3 className="text-white text-sm font-medium">
                {stories.name}
              </h3>

              <p className="text-white/60 text-xs">Just now</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:opacity-70 transition"
          >
            <X size={26} />
          </button>
        </div>
      </div>

      {/* Left Click Area */}
      <button
        onClick={handlePrev}
        className="absolute left-0 top-0 z-40 w-1/2 h-full"
      />

      {/* Right Click Area */}
      <button
        onClick={handleNext}
        className="absolute right-0 top-0 z-40 w-1/2 h-full"
      />

      {/* Story Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Image priority
          src={currentStory.content}
          alt="story"
          fill
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default StoryViewer;
