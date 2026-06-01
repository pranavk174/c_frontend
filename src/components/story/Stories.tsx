"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Plus, Camera } from "lucide-react";

import StoryRing from "@/components/story/Rounded";

import StoryViewer from "./Storypreview";
import PremiumModal from "../HOComponents/PremiumModal";

import WhatsAppStoryPreview from "./StoryuploadPreview";
import { storyApi, useGetStoriesQuery } from "@/redux/Apis/Story";
import { modalValue, StoryContent, UserStories, valueProps } from "@/lib/dummy";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetUserQuery } from "@/redux/Apis/Users";
import { useSocket } from "@/layouts/SocketWrapper";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { STORY_LIKE, STORY_SEEN } from "@/lib/events";

const StoryList = () => {
  const socket = useSocket();
  const [open, setOpen] = useState<valueProps>(modalValue);
  const handleClose = useCallback(() => setOpen({
    type: null,
    open: false
  }), []);
  const storyRef = useRef<HTMLInputElement | null>(null);
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const [storyIndex, setStoryIndex] = useState<number>(0);
  const [modal, setModal] = useState<"storyupload" | "storypreview" | null>(
    null,
  );
  const { user } = useGetUserQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
        const result = data?.data?.getUser?.data;
        // console.log(result, "user data..", data);

        return {
          user: result,
          isLoading,
          isSuccess,
        };
      },
    },
  );

  const { storiesData } = useGetStoriesQuery(null, {
    selectFromResult: ({ data, isLoading, isSuccess }) => {
      const stories = data?.data?.getAllStories?.data?.stories || [];

      const updatedArray = [
        ...stories.filter((item: UserStories) => item.user_id === user_id),
        ...stories.filter((item: UserStories) => item.user_id !== user_id),
      ];

      const isExists = stories.some(
        (story: UserStories) => story.user_id === user?.id,
      );

      const updatedStories =
        !isExists && user
          ? [
            {
              user_id: user.id,
              name: user.name,
              profile_pic: user.profile_pic,
              stories: [],
            },
            ...stories,
          ]
          : updatedArray;

      return {
        storiesData: updatedStories,
        isLoading,
        isSuccess,
      };
    },
  });

  // console.log(storiesData, "stori data......");
  const [files, setFiles] = useState<File[]>([]);

  const onClickHandle = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (storyRef.current) {
      storyRef.current?.click();
    }
  };

  const dispatch = useAppDispatch()

  const handler = useMemo(
    () => ({
      [STORY_SEEN]: (data: any, callback: any) => {
        if (!data) {
          return callback({
            message: "no data recieved",
            status: 404,
            success: false,
          });
        }

        dispatch(
          storyApi.util.updateQueryData("getStories", null, (draft) => {
            console.log(data, "story seen successssss");
            draft.data.getAllStories.data.stories.forEach(
              (story: UserStories) => {
                console.log(data, "story seen inner  successssss");
                story.stories.forEach((st) => {
                  if (st.id === data.story_id) {
                    if (!st.interactions) {
                      st.interactions = [];
                    }

                    const alreadyExists = st.interactions.some(
                      (i) => i.id === data.user_id,
                    );

                    console.log("ye condition true hai", alreadyExists);

                    if (!alreadyExists) {
                      st.interactions.push({
                        id: data.user_id,
                        seen: true,
                        name: data.name,
                        seen_at: data.seen_at,
                        liked: false,
                        liked_at: null,
                        profile_pic: data.profile_pic,
                      });
                    }
                  } else {
                    console.log("condition false....");
                  }
                });
              },
            );
          }),
        );

        return callback({
          message: "Frontend Updated",
          status: 201,
          success: true,
        });
      },
      [STORY_LIKE]: (data: any, callback: any) => {

        if (!data) {
          return callback({
            message: "Data is mIssing",
            status: 400,
            success: false
          })
        }

        console.log("liked ddaaaaataa..", data)

        dispatch(storyApi.util.updateQueryData(
          "getStories", null, (draft) => {

            draft.data.getAllStories.data.stories.forEach((story: UserStories) => {
              story.stories.forEach((st: StoryContent) => {


                if (st.id === data.story_id) {
                  st?.interactions?.forEach((int) => {

                    if (int.id === data.user_id) {
                      int.liked = data.liked

                    }


                  })
                }

              })
            })
          }
        ))

      }
    }),
    [dispatch],
  );

  useSocketEvents(socket, handler);



  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log(e.target.files, "input eventssss");
      if (e.target.files) {
        setFiles(Array.from(e.target.files));

        setOpen({
          type: "storyupload",
          open: true
        });
        setModal("storyupload");
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
            {socket.id}
          </p>
        </div>

        <button
          onClick={onClickHandle}
          className="w-10 h-10 rounded-full bg-[#202c33] hover:bg-wa-search-input-dark transition flex items-center justify-center"
        >
          <Camera size={20} className="text-wa-primary" />
        </button>
      </div>

      {/* Stories */}
      <div className="flex w-full justify-center h-full ">
        <div className="flex bg-[#0b141a]   flex-col mt-7.5 gap-2 max-w-3xl w-full h-[80vh] mx-auto overflow-y-auto hide-scrollbar rounded-lg p-5 ">
          {storiesData?.map((story: UserStories, idx: number) => (
            <div
              onClick={(e) => {
                e.stopPropagation();
                // e.preventDefault();

                if (story.stories.length === 0) {
                  onClickHandle(e);
                  return;
                }

                setOpen({
                  type: "storypreview",
                  open: true
                });
                setModal("storypreview");
                setStoryIndex(idx);
              }}
              key={story?.user_id}
              className="flex gap-4 bg-gray-700 rounded-lg hover:bg-gray-400 px-2 items-center cursor-pointer group"
            >
              {/* Own Story */}
              {story?.user_id === user_id ? (
                <div className="relative">
                  <StoryRing
                    segments={story?.stories?.length}
                    url={story?.profile_pic || ""}
                    seenStories={story?.stories?.map((story) => story?.seen)}
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
                    className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-wa-primary flex items-center justify-center border border-[#0b141a]"
                  >
                    <Plus size={14} className="text-white" strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <div className="rounded-full p-0.75 transition duration-300 group-hover:scale-105">
                  <StoryRing
                    segments={story?.stories?.length}
                    url={story?.profile_pic || ""}
                    seenStories={story?.stories?.map((story) => story?.seen)}
                  />
                </div>
              )}

              {/* Username */}
              <div className="flex justify-start flex-col text-gray-200 font-bold text-[clamp(14px,4vw,14px)] text-start truncate ">
                {story?.name}

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

      <PremiumModal values={open} onClose={handleClose}>

        {user_id && open.type === "storypreview" && (
          <StoryViewer
            user_id={user_id}
            stories={storiesData[storyIndex]}
            onClose={handleClose}
          />
        )}

        {open.type === "storyupload" && (
          <WhatsAppStoryPreview
            // setModal={setModal}
            setOpen={setOpen}
            files={files}
          />
        )}
      </PremiumModal>
    </div>
  );
};

export default StoryList;
