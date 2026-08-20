import UserCard from "@/components/User/UserCard";
import { Props } from "@/lib/dummy";
import { logger } from "@/lib/utils";
import { LucideIcon, LucideProps, Radio } from "lucide-react";
import React, { memo, ReactElement } from "react";

const Privacyoptions = ({
  Logo,
  label,
  type,
  active,
  onClickHandeler,
  setSelected,
  selected,
  users,
}: Props) => {
  logger.debug(selected, active, "activeeee ", active === type);
  return (
    <div className="w-full">
      <button
        role="button"
        onClick={() => {
          if (type === active) {
            onClickHandeler("everyone");
          } else {
            onClickHandeler(type);
          }
        }}
        className={`flex items-center w-full gap-3 p-3 rounded-lg cursor-pointer ${active === type && "bg-wa-primary"} hover:bg-wa-primary hover:text-white transition-colors duration-200`}
      >
        <div className="p-3 rounded-[50%] bg-gray-500">{Logo}</div>
        <span>{label}</span>
      </button>

      <div
        className={`transition-all  overflow-y-auto duration-400 ${
          active === type ? "h-100" : "h-0"
        } ${active === null ? "hidden" : ""}`}
      >
        <div className="bg-wa-bg-dark p-3 border-b border-wa-search-input-dark">
          <input
            type="text"
            placeholder="Search name..."
            className="w-full bg-[#202c33] text-white placeholder:text-gray-400 rounded-lg px-4 py-2 outline-none"
          />
        </div>
        <div className="h-[250px] overflow-y-auto">
          {users?.length === 0 ? (
            <div>
              <div className="flex   flex-1 justify-center items-center ">
                <h3 className="font-bold text-white text-[clamp(16px,50vw,17px)]">
                  No New Users Found
                </h3>
              </div>
            </div>
          ) : (
            users?.map((user) => (
              <UserCard
                onClick={(value) => {
                  if (value) {
                    setSelected((prev) => {
                      return [...prev, user.id];
                    });
                  } else {
                    setSelected((prev) => {
                      return prev.filter((id) => id !== user.id);
                    });
                  }
                }}
                selectedUser={selected.includes(user.id)}
                key={user.id}
                user={user}
                type={"group"}
              />
            ))
          )}
        </div>
      </div>
      {/* <Radio /> */}
    </div>
  );
};

export default memo(Privacyoptions);
