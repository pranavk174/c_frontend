"use client";

import React, { useCallback, useRef, useState } from "react";
import { Plus, Camera } from "lucide-react";
import Image from "next/image";
import StoryRing from "@/components/story/Rounded";
import Modal from "../HOComponents/Modal";
import StoryViewer from "./Storypreview";
import PremiumModal from "../HOComponents/PremiumModal";
import { uploadImage } from "@/lib/utils";
import WhatsAppStoryPreview from "./StoryuploadPreview";
import { useGetStoriesQuery } from "@/redux/Apis/Story";

const stories = [
  {
    id: 1,
    name: "Your Story",
    image: "https://i.pravatar.cc/150?img=1",
    isOwn: true,
    content: [
      {
        id: 1,
        type: "image",
        url: "https://picsum.photos/400/700?random=1",
      },
      {
        id: 2,
        type: "image",
        url: "https://picsum.photos/400/700?random=2",
      },
    ],
  },

  {
    id: 2,
    name: "Aman",
    image: "https://i.pravatar.cc/150?img=12",
    seen: false,
    content: [
      {
        id: 1,
        type: "image",
        url: "https://picsum.photos/400/700?random=3",
      },
      {
        id: 2,
        type: "image",
        url: "https://picsum.photos/400/700?random=4",
      },
      {
        id: 3,
        type: "image",
        url: "https://picsum.photos/400/700?random=5",
      },
    ],
  },

  {
    id: 3,
    name: "Rohit",
    image: "https://i.pravatar.cc/150?img=13",
    seen: true,
    content: [
      {
        id: 1,
        type: "image",
        url: "https://picsum.photos/400/700?random=6",
      },
    ],
  },

  {
    id: 4,
    name: "Priya",
    image: "https://i.pravatar.cc/150?img=14",
    seen: false,
    content: [
      {
        id: 1,
        type: "image",
        url: "https://picsum.photos/400/700?random=7",
      },
      {
        id: 2,
        type: "image",
        url: "https://picsum.photos/400/700?random=8",
      },
    ],
  },

  {
    id: 5,
    name: "Neha",
    image: "https://i.pravatar.cc/150?img=15",
    seen: true,
    content: [
      {
        id: 1,
        type: "image",
        url: "https://picsum.photos/400/700?random=9",
      },
    ],
  },

  {
    id: 6,
    name: "Karan",
    image: "https://i.pravatar.cc/150?img=16",
    seen: false,
    content: [
      {
        id: 1,
        type: "image",
        url: "https://picsum.photos/400/700?random=10",
      },
      {
        id: 2,
        type: "image",
        url: "https://picsum.photos/400/700?random=11",
      },
    ],
  },
];

const StoryList = () => {
  const [open, setOpen] = useState<boolean>(false);
  const handleClose = useCallback(() => setOpen(false), []);
  const storyRef = useRef(null);

  const { storiesData, isLoading, isSuccess } = useGetStoriesQuery(null, {
    selectFromResult: ({ data, isLoading, isSuccess }) => {
      return {
        storiesData: data?.data?.getAllStories?.data?.stories,
        isLoading,
        isSuccess,
      };
    },
  });

  console.log(storiesData, "stori data......");
  const [files, setFiles] = useState<File[]>([]);

  const onClickHandle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (storyRef.current) {
      storyRef.current?.click();
    }
  };

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log(e.target.files, "input eventssss");
      if (e.target.files) {
        setFiles(Array.from(e.target.files));

        setOpen(true);
      }
      // await uploadImage()
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full h-screen wa-primary-dark px-4 py-4 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white text-xl font-semibold">Updates</h2>
          <p className="text-gray-400 text-sm">
            Status updates from your contacts
          </p>
        </div>

        <button
          onClick={onClickHandle}
          className="w-10 h-10 rounded-full bg-[#202c33] hover:bg-[#2a3942] transition flex items-center justify-center"
        >
          <Camera size={20} className="text-[#00a884]" />
        </button>
      </div>

      {/* Stories */}
      <div className="flex w-full justify-center h-full ">
        <div className="flex bg-[#0b141a]   flex-col mt-[30px] gap-2 max-w-3xl w-full h-[80vh] mx-auto overflow-y-auto hide-scrollbar rounded-lg p-5 ">
          {stories.map((story) => (
            <div
              onClick={(e) => {
                e.stopPropagation();
                // e.preventDefault();
                setOpen((p) => !p);
              }}
              key={story.id}
              className="flex gap-4 bg-gray-700 rounded-lg hover:bg-gray-400 px-2 items-center cursor-pointer group"
            >
              {/* Own Story */}
              {story.isOwn ? (
                <div className="relative">
                  <StoryRing
                    segments={5}
                    url={story.image}
                    seenStories={[true, false, true, false, false]}
                  />

                  <input
                    ref={storyRef}
                    type="file"
                    onChange={onChange}
                    className="hidden"
                    multiple
                  />

                  {/* Add Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      //   e.stopPropagation();
                      onClickHandle(e);
                    }}
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center border-[3px] border-[#0b141a]"
                  >
                    <Plus size={14} className="text-white" strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <div className="rounded-full p-[3px] transition duration-300 group-hover:scale-105">
                  <StoryRing
                    segments={5}
                    url={story.image}
                    seenStories={[true, false, true, false, false]}
                  />
                </div>
              )}

              {/* Username */}
              <div className="flex justify-start flex-col text-gray-200 font-bold text-[clamp(14px,4vw,14px)] text-start truncate w-[82px]">
                {story.name}

                <span className="text-[10px] text-start truncate">Now</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 
      <Modal open={open} setOpen={setOpen}>
        <StoryViewer
          stories={stories[1].content}
          onClose={() => {
            setOpen((p) => !p);
          }}
        />
      </Modal> */}

      <PremiumModal open={open} onClose={handleClose}>
        {/* <StoryViewer stories={stories[1].content} onClose={handleClose} /> */}

        <WhatsAppStoryPreview files={files} />
      </PremiumModal>
    </div>
  );
};

export default StoryList;
