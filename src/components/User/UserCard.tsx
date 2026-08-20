import { NewChatProps, User } from "@/lib/dummy";
import React, { useRef, useState } from "react";
import Image from "next/image";
import Checkbox from "../Utility/Checkbox";
import { logger } from "@/lib/utils";


interface onClickProps {
  selected?: boolean
  user?: boolean;
}

const UserCard = ({
  user,
  selectedUser,
  type,
  onClick,
  handleCreate
}: {
  user: User;
  selectedUser?: boolean;
  type: string;
  onClick?: (selected?: boolean) => void;
  handleCreate?: (member_id: number, chat_id: number | null) => void
}) => {
  const [selected, setSelected] = useState<boolean>(() => {
    if (selectedUser) {
      return true;
    } else {
      return false;
    }
  });




  logger.log(selected, "selected ", user.id, selectedUser);
  return (
    <div
      role="button"
      key={user.id}
      onClick={() => {
        if (type === "chat") {
          handleCreate?.(user.id, user.chat_id)
        }
        else {
          const newSelected = !selected;
          setSelected(newSelected);
          onClick?.(newSelected);
        }
      }}
      className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors border-b border-[#182229]"
    >
      {/* Avatar */}
      {user.profile_pic ? (
        <Image
          height={100}
          width={100}
          src={user.profile_pic}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-wa-primary flex items-center justify-center text-white font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
      {/* User Details */}
      <div className="flex   items-center gap-3 flex-1 min-w-0">
        <div className="flex ">
          <span className="text-white font-medium truncate">{user.name}</span>

          <span className="text-sm text-gray-400 truncate">
            @{user.username}
          </span>
        </div>
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      {/* Online Dot */}

      {type !== 'chat' && (
        <Checkbox
          id="default-checkbox"
          label="Default checkbox"
          checked={selected}
          onChange={setSelected}
        />
      )}
    </div>
  );
};

export default UserCard;
