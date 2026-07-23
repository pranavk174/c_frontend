import React, { useState } from "react";
import Image from "next/image";
import Checkbox from "../Utility/Checkbox";
import { NewChatProps } from "@/lib/dummy";
import UserCard from "../User/UserCard";
import { logger } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Uploader from "../Utility/Uploader";
import { useCreateNewGroupMutation } from "@/redux/Apis/Chat";
import UserList from "./UserList";

interface formProps {
  groupName: string;
  members: number[];
  cover_pic: string | null;
  profile_pic: string | null;
}

const NewGroupTab = ({ users }: NewChatProps) => {

  const [createNewGroup, { isLoading: isCreating }] =
    useCreateNewGroupMutation();
  const [formData, setFormData] = useState<formProps>({
    groupName: "",
    members: [],
    cover_pic: null,
    profile_pic: null,
  });

  const [active, setActive] = useState("members");

  const handleSubmit = async () => {
    try {
      await createNewGroup(formData).unwrap();
    } catch (error) {
      logger.log(error);
    }
  };

  return (
    <div className="relative h-full px-2">
      {" "}
      {active === "members" && (
        <>
          {" "}
          <div className="bg-[#202c33] px-4 py-4 border-b border-wa-search-input-dark">
            <h2 className="text-xl font-semibold text-white">New Group</h2>
          </div>


          <div className="bg-wa-bg-dark p-3 border-b border-wa-search-input-dark">
            <input
              type="text"
              placeholder="Search name..."
              className="w-full bg-[#202c33] text-white placeholder:text-gray-400 rounded-lg px-4 py-2 outline-none"
            />
          </div>
          <div className="h-[250px] overflow-y-auto">
            {users.length === 0 ? (
              <div>
                <div className="flex   flex-1 justify-center items-center ">
                  <h3 className="font-bold text-white text-[clamp(16px,50vw,17px)]">
                    No New Users Found
                  </h3>
                </div>
              </div>
            ) : (
              users.map((user) => (
                <UserCard
                  onClick={(value) => {
                    setFormData((prev) => {
                      if (value) {
                        return {
                          ...prev,
                          members: [...prev.members, user.id],
                        };
                      }

                      return {
                        ...prev,
                        members: prev.members.filter((id) => id !== user.id),
                      };
                    });

                    logger.log(formData, "formdataa");
                  }}
                  selectedUser={formData.members.includes(user.id)}
                  key={user.id}
                  user={user}
                  type={"group"}
                />
              ))
            )}
          </div>
        </>
      )}
      {active === "groupname" && (
        <div className=" ">
          {/* Header */}
          <div className="bg-[#202c33] px-4 py-4 border-b border-wa-search-input-dark">
            <h2 className="text-xl font-semibold text-white">
              Enter Group Name
            </h2>
          </div>

          <div className="relative">
            <Uploader
              isUser={true}
              cover_pic={formData?.cover_pic}
              profile_pic={formData?.profile_pic}
              setFormData={setFormData}
              formData={formData}
            />
          </div>

          {/* Group Name Input */}
          <div className="bg-wa-bg-dark p-4">
            <label
              htmlFor="group-name"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Group Name
            </label>

            <input
              id="group-name"
              type="text"
              value={formData.groupName}
              onChange={(e) =>
                setFormData((prev) => {
                  return { ...prev, groupName: e.target.value };
                })
              }
              placeholder="Enter group name..."
              className="
        w-full
        bg-[#202c33]
        text-white
        placeholder:text-gray-400
        rounded-lg
        px-4
        py-3
        outline-none
        border
        border-transparent
        focus:border-wa-primary
        transition-colors
      "
            />
          </div>

          {/* Create Button */}
        </div>
      )}
      <div className="flex gap-x-3 justify-center gap-2">
        <button
          type="button"
          disabled={active === "members"}
          onClick={() => setActive("members")}
          className="flex-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-3 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="submit"
          onClick={() => {
            if (active === "members") {
              setActive("groupname");
              return;
            } else {
              handleSubmit();
            }
          }}
          disabled={formData.members.length === 0}
          className="  w-full bg-wa-primary  block max-w-[150px] hover:bg-wa-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-1 rounded transition-colors"
        >
          {/* {isLoading ? "Creating Group...." : "Create Group"} */}
          {active === "members" ? "Next" : "Create Group"}
        </button>
      </div>
    </div>
  );
};

export default NewGroupTab;
