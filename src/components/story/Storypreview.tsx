"use client";

import Image from "next/image";
import { X, Heart, Send, Mic, ClockFading } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  socketResponse,
  StoryContent,
  StoryItem,
  UserStories,
} from "@/lib/dummy";
import {
  storyApi,
  useLikeStoryMutation,
  useSeenStoryMutation,
} from "@/redux/Apis/Story";
import { chatApi } from "@/redux/Apis/Chat";

import { useToast } from "../Utility/Toast";
import { useSocket } from "@/layouts/SocketWrapper";
import { STORY_LIKE, STORY_REPLY, STORY_SEEN } from "@/lib/events";
import { socketCallback } from "@/lib/utils";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { div } from "framer-motion/client";
import Loader from "../Utility/Loader";
import SmallLoader from "../Utility/SpinLoader";

// interface StoryItem {
//   id: number;
//   url: string;
//   seen?: boolean;
// }

interface StoryViewerProps {
  stories: UserStories;
  initialIndex?: number;
  onClose?: () => void;
  user_id: number;
}

const STORY_DURATION = 5000;

const StoryViewer = ({
  stories,
  initialIndex = 0,
  user_id,
  onClose,
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const [progress, setProgress] = useState(0);
  const [seenStory] = useSeenStoryMutation();
  const [isPaused, setIsPaused] = useState(false);
  // Keep onClose in a ref so the effect never needs it as a dependency
  const socket = useSocket();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const { showToast } = useToast();
  const [replyMessage, setReplyMessage] = useState<string>("");
  const currentStory = stories.stories[currentIndex];
  const dispatch = useAppDispatch();
  const [likeStory] = useLikeStoryMutation();
  const handelSendReplyStory = async () => {
    try {
      // await replyToStory({
      //   id: currentStory.id,
      //   content: replyMessage,
      // }).unwrap();

      // const patchResult = dispatch(
      //   chatApi.util.updateQueryData(
      //     "getSingleChat",
      //     { chat_id: [id] },
      //     (draft) => {},
      //   ),
      // );

      socket.emit(
        STORY_REPLY,
        { id: currentStory.id, content: replyMessage },
        (response: socketResponse) => {
          if (response.success) {
            showToast(response.message, "success");
            setReplyMessage("");
            setIsPaused(false);
            dispatch(chatApi.util.invalidateTags(["chats"]));

            return true;
          }
        },
      );
    } catch (error) {
      showToast("error in reply story", "error");
      console.log(error, "errorrrr");
      return false;
    }
  };

  const [state, formAction, isPending] = useActionState(
    handelSendReplyStory,
    null,
  );

  // console.log(isPending, "loading stateee");
  // Story Progress
  useEffect(() => {
    if (isPaused) return;
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
  }, [currentIndex, stories.stories.length, isPaused]);

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
    }),
    [dispatch],
  );

  useSocketEvents(socket, handler);

  // console.log(stories.stories, "storiesss dataaaaa.............");

  useEffect(() => {
    try {
      if (stories.user_id !== user_id && !currentStory.seen) {
        socket.emit(
          STORY_SEEN,
          { id: currentStory.id },
          (response: socketResponse) => {
            if (response.success)
              dispatch(
                storyApi.util.updateQueryData("getStories", null, (draft) => {
                  draft.data.getAllStories.data.stories.forEach(
                    (story: UserStories) => {
                      story.stories.forEach((st) => {
                        if (st.id === currentStory.id && !st.seen) {
                          st.seen = true;
                        } else {
                          console.log("condition false....");
                        }
                      });
                    },
                  );
                }),
              );

            console.log("responseform story seend");
          },
        );
        // seenStory({ id: currentStory.id }).unwrap();
      }
    } catch (error) {
      console.log(error, "error in story seend");
    }
  }, [currentStory, seenStory, socket, stories.user_id, user_id, dispatch]);

  // const handleLikeStory = (like: boolean) => {
  //   try {

  //     const patchResult = dispatch(storyApi.util.updateQueryData(
  //       "getStories", null, (draft) => {


  //         draft.data.getAllStories.data.stories.forEach((story: UserStories) => {

  //           story.stories.forEach((st: StoryContent) => {
  //             if (st.id === currentStory.id) {
  //               st.liked = like
  //             }
  //           })
  //         })
  //       }
  //     ))


  //     socket.emit(
  //       STORY_LIKE,
  //       { id: currentStory.id, like },
  //       (response: socketResponse) => {
  //         console.log(response, "response from liked story....");

  //         if (!response.success) {
  //           patchResult.undo()
  //         }
  //         // setIsPaused(false)

  //       },
  //     );
  //     // await likeStory({ id: currentStory.id, like }).unwrap();

  //   } catch (error) {
  //     console.log("errrro", error);
  //     showToast("erroro in liking", "error");
  //   }
  //   finally {
  //     console.log("finnnaly block....")
  //     console.log(isPaused, "before");
  //     setIsPaused(p => !p);
  //     console.log(isPaused, "after");
  //   }
  // };

  const handleLikeStory = async (like: boolean) => {

    try {



      const patchResult = dispatch(
        storyApi.util.updateQueryData(
          "getStories",
          null,
          (draft) => {

            draft.data.getAllStories.data.stories.forEach((story: UserStories) => {

              story.stories.forEach((st: StoryContent) => {

                if (st.id === currentStory.id) {
                  st.liked = like;
                }

              });

            });

          }
        )
      );

      const response: socketResponse = await new Promise((resolve) => {

        socket.emit(
          STORY_LIKE,
          { id: currentStory.id, like },
          (response: socketResponse) => {
            resolve(response);
          }
        );

      });

      if (!response.success) {
        patchResult.undo();
      }

    } catch (error) {

      console.log(error);

    } finally {

      setIsPaused(false);

    }
  };

  console.log(isPaused, "is Pauseddddd")

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

  // console.log(stories, "storiessssss");

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Top Overlay */}
      <div className="absolute top-0 left-0 z-50 w-full p-4">
        {/* Progress Bars */}
        <div className="flex gap-1 mb-4">
          {stories.stories.map((story, index) => (
            <div
              key={story.id}
              className="flex-1 h-0.75 bg-white/30 rounded-full overflow-hidden"
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
            <Image
              priority
              src={stories.profile_pic ?? ""}
              alt="profile"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div>
              <h3 className="text-white text-sm font-medium">{stories.name}</h3>

              <p className="text-white/60 text-xs">
                {/* {stories.stories[currentIndex].created_at} */}
                {new Date(
                  Number(stories.stories[currentIndex]?.created_at),
                ).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
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

      {currentStory?.interactions && stories?.user_id === user_id && (
        <div
          onClick={() => setIsPaused((p) => !p)}
          className="absolute w-full cursor-pointer   bottom-0 h-screen  z-50  transition-all duration-300"
          style={{
            // opacity: isPaused ? 1 : 0,
            height: !isPaused ? "12%" : "100%",
            // transform: `${isPaused ? "translateY(100px)" : "translateY(580px)"}`,
          }}
        >
          <div
            className={`absolute w-full px-2 overflow-y-hidden cursor-pointer ${isPaused ? "bottom-0" : "bottom-0"}  h-2/3`}
          >
            <div className="py-7  px-5 flex justify-between items-center bg-gray-800">
              <h4 className="text-[clamp(16px,15vw,16px)] font-bold capitalize">
                Viewed by {"  "}
                {currentStory.interactions.length}{" "}
              </h4>

              <div>
                {isPaused && (
                  <button
                    className="hover:bg-gray-500 rounded-lg p-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused((p) => !p);
                    }}
                  >
                    <X className="h-5 w-5  text-gray-200" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-2 bg-wa-bg-dark overflow-y-auto h-[56vh] rounded-b-md hide-scrollbar ">
              {currentStory.interactions.map((interaction) => {
                return (
                  <div
                    key={interaction.id}
                    className="  justify-between flex items-center  rounded-md  py-3   "
                  >
                    <div className="px-3   flex items-center gap-4">
                      <div className="overflow-hidden h-18 w-18 border border-wa-bg rounded-full">
                        <Image
                          src={interaction.profile_pic || ""}
                          priority
                          height={80}
                          width={80}
                          className="rounded-full"
                          alt={interaction.name}
                        />
                      </div>
                      <div>
                        <h5 className="font-semibold  capitalize ">
                          {interaction.name}
                        </h5>
                        <button className="font-thin  capitalize ">
                          {interaction.seen_at}
                        </button>
                      </div>
                    </div>
                    <div className="mr-5">
                      {interaction.liked && (
                        <button>
                          <Heart className="h-5 w-5 font-thin text-wa-primary fill-wa-primary" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {stories.user_id !== user_id && (
        <div
          onClick={() => setIsPaused(true)}
          className="absolute bottom-2 w-full z-50 p-5 "
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!replyMessage.trim()) return;

              startTransition(() => {
                formAction();
              });
            }}
            className="flex  items-center px-2 py-2"
          >
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type a message"
              className="w-full bg-wa-panel dark:bg-wa-search-input-dark border-none rounded-lg px-4 py-2 text-sm focus:outline-none dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <div className="ml-2 shrink-0 ">
              {isPending ? (
                <SmallLoader height={"30px"} width={"30px"} />
              ) : replyMessage.trim() ? (
                <button
                  type="submit"
                  disabled={!replyMessage.trim() || isPending}
                  className="p-2 text-wa-icon dark:text-wa-icon-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (

                <button
                  onClick={() => handleLikeStory(!currentStory.liked)}
                  className="cursor-pointer hover:scale-110 pt-2 transition-transform duration-200 "
                >
                  <Heart
                    className={`h-7 w-7 font-thin  ${currentStory.liked ? "fill-wa-primary" : ""} animation text-wa-primary `}
                  />
                </button>

              )}
            </div>
          </form>
        </div>
      )}

      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          priority
          src={currentStory?.content}
          alt="story"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default StoryViewer;
